import db from '../db/client.js';
import type { DigestItem } from '../types.js';

interface DigestRow {
  city_slug: string;
  digest_date: string;
  items_json: string;
  generated_at: string;
}

interface CityRow {
  slug: string;
  display_name: string;
}

interface FtsRow {
  city_slug: string;
  digest_date: string;
  item_index: number;
}

export interface DigestResponse {
  city: string;
  date: string;
  generated_at: string;
  items: DigestItem[];
}

export interface CityResponse {
  slug: string;
  display_name: string;
}

export interface SearchResultItem {
  item: DigestItem;
  date: string;
  city_slug: string;
}

// Returns the digest for a city on a given date, or null if not found.
export function getDigest(citySlug: string, date: string): DigestResponse | null {
  const row = db
    .prepare(
      'SELECT city_slug, digest_date, items_json, generated_at FROM digests WHERE city_slug = ? AND digest_date = ?',
    )
    .get(citySlug, date) as DigestRow | undefined;

  if (!row) return null;

  return {
    city: row.city_slug,
    date: row.digest_date,
    generated_at: row.generated_at,
    items: JSON.parse(row.items_json) as DigestItem[],
  };
}

// Returns all active cities.
export function getCities(): CityResponse[] {
  return db
    .prepare('SELECT slug, display_name FROM cities WHERE is_active = 1 ORDER BY display_name')
    .all() as CityRow[];
}

// Upserts a digest and keeps digests_fts in sync.
export function upsertDigest(citySlug: string, date: string, items: DigestItem[]): void {
  db.prepare(
    `INSERT OR REPLACE INTO digests (city_slug, digest_date, items_json) VALUES (?, ?, ?)`,
  ).run(citySlug, date, JSON.stringify(items));

  // Replace FTS rows for this (city, date) pair
  db.prepare(`DELETE FROM digests_fts WHERE city_slug = ? AND digest_date = ?`).run(citySlug, date);

  const insertFts = db.prepare(
    `INSERT INTO digests_fts (title, summary, city_slug, digest_date, item_index) VALUES (?, ?, ?, ?, ?)`,
  );

  db.transaction(() => {
    for (let i = 0; i < items.length; i++) {
      insertFts.run(items[i].title, items[i].summary, citySlug, date, i);
    }
  })();
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for',
  'is', 'are', 'was', 'were', 'with', 'from', 'by', 'as', 'its', 'it',
  'be', 'been', 'has', 'have', 'had', 'that', 'this', 'will', 'new',
  'after', 'over', 'into', 'up', 'out', 'about', 'also', 'than',
]);

// Extracts meaningful keywords from a news title for OR-based FTS5 matching
// against the title column only.
function buildRelatedQuery(title: string): string {
  const tokens = title
    .replace(/[^\w\s]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOP_WORDS.has(t) && !/^\d+$/.test(t));

  if (tokens.length === 0) return '';
  // OR match — at least one keyword must appear in the candidate's title
  return tokens.slice(0, 5).map((t) => `title:"${t}"*`).join(' OR ');
}

// Returns up to `limit` DigestItems related to the given title and category
// from the last `days` days, excluding the source item itself.
export function getRelatedStories(
  citySlug: string,
  title: string,
  category: string,
  days = 30,
  limit = 3,
): SearchResultItem[] {
  const ftsQuery = buildRelatedQuery(title);
  if (!ftsQuery) return [];

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  // Fetch more than needed to account for category filtering and self-exclusion
  const rows = db
    .prepare(
      `SELECT city_slug, digest_date, item_index
       FROM digests_fts
       WHERE digests_fts MATCH ? AND city_slug = ? AND digest_date >= ?
       ORDER BY rank
       LIMIT ?`,
    )
    .all(ftsQuery, citySlug, cutoffStr, limit * 6) as FtsRow[];

  // Group by (city_slug, digest_date) to minimise digest reads
  const groups = new Map<string, FtsRow[]>();
  for (const row of rows) {
    const key = `${row.city_slug}::${row.digest_date}`;
    const bucket = groups.get(key);
    if (bucket) bucket.push(row);
    else groups.set(key, [row]);
  }

  const normalizedTitle = title.toLowerCase().trim();
  const results: SearchResultItem[] = [];

  for (const groupRows of groups.values()) {
    if (results.length >= limit) break;
    const { city_slug, digest_date } = groupRows[0];
    const digestRow = db
      .prepare(`SELECT items_json FROM digests WHERE city_slug = ? AND digest_date = ?`)
      .get(city_slug, digest_date) as { items_json: string } | undefined;

    if (!digestRow) continue;
    const items = JSON.parse(digestRow.items_json) as DigestItem[];

    for (const row of groupRows) {
      if (results.length >= limit) break;
      const item = items[row.item_index];
      if (!item) continue;
      if (item.category !== category) continue;
      if (item.title.toLowerCase().trim() === normalizedTitle) continue; // exclude self
      results.push({ item, date: digest_date, city_slug });
    }
  }

  return results;
}

// Sanitizes a user query for safe use in FTS5 MATCH expressions.
// Each whitespace-delimited token becomes a prefix search term; all must match (implicit AND).
function sanitizeFtsQuery(q: string): string {
  const tokens = q
    .replace(/["*()\-+^]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return '';
  return tokens.map((t) => `"${t}"*`).join(' ');
}

// Returns all DigestItems matching a category for a city over the last `days` days,
// sorted newest-first.
export function getCategoryItems(
  citySlug: string,
  category: string,
  days = 30,
): SearchResultItem[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  const rows = db
    .prepare(
      `SELECT city_slug, digest_date, items_json
       FROM digests
       WHERE city_slug = ? AND digest_date >= ?
       ORDER BY digest_date DESC`,
    )
    .all(citySlug, cutoffStr) as DigestRow[];

  const results: SearchResultItem[] = [];
  for (const row of rows) {
    const items = JSON.parse(row.items_json) as DigestItem[];
    for (const item of items) {
      if (item.category === category) {
        results.push({ item, date: row.digest_date, city_slug: row.city_slug });
      }
    }
  }
  return results;
}

// Full-text search across all digests (or a single city if citySlug is provided).
// Returns up to 50 matching DigestItems with their date and city.
export function searchDigests(q: string, citySlug?: string): SearchResultItem[] {
  const ftsQuery = sanitizeFtsQuery(q);
  if (!ftsQuery) return [];

  const rows = (
    citySlug
      ? db
          .prepare(
            `SELECT city_slug, digest_date, item_index
             FROM digests_fts
             WHERE digests_fts MATCH ? AND city_slug = ?
             ORDER BY rank
             LIMIT 50`,
          )
          .all(ftsQuery, citySlug)
      : db
          .prepare(
            `SELECT city_slug, digest_date, item_index
             FROM digests_fts
             WHERE digests_fts MATCH ?
             ORDER BY rank
             LIMIT 50`,
          )
          .all(ftsQuery)
  ) as FtsRow[];

  // Group by (city_slug, digest_date) to minimise digest table reads
  const groups = new Map<string, FtsRow[]>();
  for (const row of rows) {
    const key = `${row.city_slug}::${row.digest_date}`;
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(row);
    } else {
      groups.set(key, [row]);
    }
  }

  const results: SearchResultItem[] = [];

  for (const groupRows of groups.values()) {
    const { city_slug, digest_date } = groupRows[0];
    const digestRow = db
      .prepare(`SELECT items_json FROM digests WHERE city_slug = ? AND digest_date = ?`)
      .get(city_slug, digest_date) as { items_json: string } | undefined;

    if (!digestRow) continue;

    const items = JSON.parse(digestRow.items_json) as DigestItem[];

    for (const row of groupRows) {
      const item = items[row.item_index];
      if (item) results.push({ item, date: digest_date, city_slug });
    }
  }

  return results;
}
