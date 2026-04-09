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
