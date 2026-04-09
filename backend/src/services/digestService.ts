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
