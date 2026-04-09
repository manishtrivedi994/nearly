import crypto from 'node:crypto';
import axios from 'axios';
import Parser from 'rss-parser';
import type { Database } from 'better-sqlite3';
import type { CityConfig, RssSourceConfig, RawItem } from '../types.js';

const rssParser = new Parser();

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// Fetches articles from newsapi.org for all newsapi sources configured for a city.
export async function fetchNewsAPI(city: CityConfig): Promise<RawItem[]> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey) throw new Error('NEWSAPI_KEY env var is not set');

  const items: RawItem[] = [];

  for (const source of city.sources) {
    if (source.type !== 'newsapi') continue;

    try {
      const response = await axios.get<{ articles: NewsApiArticle[] }>(
        'https://newsapi.org/v2/everything',
        {
          params: {
            q: source.query,
            language: source.language,
            pageSize: 30,
            apiKey,
          },
          timeout: 10_000,
        },
      );

      for (const article of response.data.articles ?? []) {
        if (!article.title || article.title === '[Removed]') continue;
        const sourceName = article.source?.name ?? 'NewsAPI';
        items.push({
          city_slug: city.slug,
          source_type: 'newsapi',
          source_name: sourceName,
          title: article.title,
          url: article.url ?? null,
          raw_text: article.description ?? article.content ?? null,
          content_hash: sha256(article.title + sourceName),
        });
      }
    } catch (err) {
      console.error(`[ERROR] fetchNewsAPI ${city.slug} "${source.query}":`, (err as Error).message);
    }
  }

  return items;
}

// Fetches a single RSS feed and returns RawItems tagged with the given citySlug.
export async function fetchRSS(source: RssSourceConfig, citySlug: string): Promise<RawItem[]> {
  const items: RawItem[] = [];

  try {
    const feed = await rssParser.parseURL(source.url);

    for (const entry of feed.items ?? []) {
      if (!entry.title) continue;
      items.push({
        city_slug: citySlug,
        source_type: 'rss',
        source_name: source.name,
        title: entry.title,
        url: entry.link ?? null,
        raw_text: entry.contentSnippet ?? entry.summary ?? null,
        content_hash: sha256(entry.title + source.name),
      });
    }
  } catch (err) {
    console.error(`[ERROR] fetchRSS ${citySlug} "${source.url}":`, (err as Error).message);
  }

  return items;
}

// Removes items whose content_hash already exists in raw_items for this city (last 24h),
// and deduplicates within the batch itself.
export function deduplicateItems(items: RawItem[], db: Database): RawItem[] {
  if (items.length === 0) return [];

  const citySlug = items[0].city_slug;

  const rows = db
    .prepare(
      `SELECT content_hash FROM raw_items
       WHERE city_slug = ? AND fetched_at >= datetime('now', '-24 hours')`,
    )
    .all(citySlug) as { content_hash: string }[];

  const existingHashes = new Set(rows.map((r) => r.content_hash));
  const seen = new Set<string>();

  return items.filter((item) => {
    if (existingHashes.has(item.content_hash) || seen.has(item.content_hash)) return false;
    seen.add(item.content_hash);
    return true;
  });
}

// Inserts raw items into the raw_items table. Skips rows that conflict on content_hash.
export function saveRawItems(items: RawItem[], db: Database): void {
  if (items.length === 0) return;

  const insert = db.prepare(`
    INSERT OR IGNORE INTO raw_items
      (city_slug, source_type, source_name, title, url, raw_text, content_hash)
    VALUES
      (@city_slug, @source_type, @source_name, @title, @url, @raw_text, @content_hash)
  `);

  const insertAll = db.transaction((rows: RawItem[]) => {
    for (const row of rows) insert.run(row);
  });

  insertAll(items);
}

// Internal type for NewsAPI response articles
interface NewsApiArticle {
  source?: { name?: string };
  title?: string;
  description?: string;
  content?: string;
  url?: string;
}
