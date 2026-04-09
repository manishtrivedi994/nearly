import type { Database } from 'better-sqlite3';
import type { CityConfig, RawItem } from '../types.js';
import { fetchNewsAPI, fetchRSS, deduplicateItems, saveRawItems } from './fetcher.js';
import { summarizeForCity } from './summarizer.js';
import { upsertDigest } from '../services/digestService.js';
import { sendPushToCity } from '../services/pushService.js';

interface RawItemRow {
  city_slug: string;
  source_type: 'newsapi' | 'rss' | 'twitter';
  source_name: string;
  title: string;
  url: string | null;
  raw_text: string | null;
  content_hash: string;
}

function todayIST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

// Executes the full 8-step pipeline for one city.
// Any thrown error is caught, logged with step context, and does not re-throw —
// so the caller can safely move on to the next city.
export async function runPipelineForCity(city: CityConfig, db: Database): Promise<void> {
  let step = '';

  try {
    // Step 2: Fetch raw items from all sources
    step = 'fetch-newsapi';
    const newsItems = await fetchNewsAPI(city);

    step = 'fetch-rss';
    const rssItems: RawItem[] = [];
    for (const source of city.sources) {
      if (source.type === 'rss') {
        if (!source.url) continue; // skip placeholder sources with empty url
        const items = await fetchRSS(source, city.slug);
        rssItems.push(...items);
      }
    }

    const fetched = [...newsItems, ...rssItems];

    // Step 3: Deduplicate against existing hashes (last 24h)
    step = 'deduplicate';
    const newItems = deduplicateItems(fetched, db);

    // Step 4: Save new raw items
    step = 'save';
    saveRawItems(newItems, db);

    // Step 5: Load all raw items for this city from last 6h
    step = 'load';
    const recentRows = db
      .prepare(
        `SELECT city_slug, source_type, source_name, title, url, raw_text, content_hash
         FROM raw_items
         WHERE city_slug = ? AND fetched_at >= datetime('now', '-6 hours')`,
      )
      .all(city.slug) as RawItemRow[];

    const recentItems: RawItem[] = recentRows.map((row) => ({
      city_slug: row.city_slug,
      source_type: row.source_type,
      source_name: row.source_name,
      title: row.title,
      url: row.url,
      raw_text: row.raw_text,
      content_hash: row.content_hash,
    }));

    if (recentItems.length === 0) {
      console.log(`[INFO] ${city.slug} — no raw items in last 6h, skipping summarize`);
      return;
    }

    // Step 6: Summarize via Groq — skip if digest already exists for today
    step = 'summarize';
    const date = todayIST();
    const existing = db
      .prepare('SELECT 1 FROM digests WHERE city_slug = ? AND digest_date = ?')
      .get(city.slug, date);
    if (existing) {
      console.log(`[INFO] ${city.slug} — digest already exists for ${date}, skipping Groq call`);
      return;
    }
    const digestItems = await summarizeForCity(recentItems, city);

    if (digestItems.length === 0) {
      // summarizeForCity already logged the error; honour "save nothing" contract
      return;
    }

    // Step 7: Upsert into digests + keep FTS in sync
    step = 'upsert';
    upsertDigest(city.slug, date, digestItems);

    // Step 8: Done log + push notifications
    console.log(`[DONE] ${city.slug} — ${digestItems.length} items — ${date}`);
    await sendPushToCity(city.slug, city.display_name, db);
  } catch (err) {
    console.error(`[ERROR] ${city.slug} ${step}: ${(err as Error).message}`);
  }
}
