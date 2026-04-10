import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import cities from '../config/cities.js';

const DB_PATH = process.env.DB_PATH ?? './data/localfeed.db';

// Ensure the data directory exists before opening the file
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
// Enforce foreign key constraints (SQLite has them off by default)
db.pragma('foreign_keys = ON');

// Run schema DDL — all statements are IF NOT EXISTS so this is safe on every start
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// Backfill digests_fts for any existing digests not yet indexed
// (needed on first deploy after FTS was added)
{
  const digestCount = (db.prepare('SELECT COUNT(*) AS n FROM digests').get() as { n: number }).n;
  const ftsCount = (db.prepare('SELECT COUNT(*) AS n FROM digests_fts').get() as { n: number }).n;

  if (digestCount > 0 && ftsCount === 0) {
    const existingDigests = db
      .prepare('SELECT city_slug, digest_date, items_json FROM digests')
      .all() as { city_slug: string; digest_date: string; items_json: string }[];

    const insertFts = db.prepare(
      `INSERT INTO digests_fts (title, summary, city_slug, digest_date, item_index) VALUES (?, ?, ?, ?, ?)`,
    );

    db.transaction(() => {
      for (const digest of existingDigests) {
        const items = JSON.parse(digest.items_json) as Array<{ title: string; summary: string }>;
        for (let i = 0; i < items.length; i++) {
          insertFts.run(items[i].title, items[i].summary, digest.city_slug, digest.digest_date, i);
        }
      }
    })();

    console.log(`[DB] Backfilled FTS for ${existingDigests.length} digest(s)`);
  }
}

// Upsert cities from config on every start — adds new cities, updates sources/tier,
// but never overwrites is_active (so manual overrides in the DB are preserved).
{
  const upsert = db.prepare(`
    INSERT INTO cities (slug, display_name, is_active, tier, sources_json)
    VALUES (@slug, @display_name, @is_active, @tier, @sources_json)
    ON CONFLICT(slug) DO UPDATE SET
      display_name = excluded.display_name,
      tier         = excluded.tier,
      sources_json = excluded.sources_json
  `);

  const upsertAll = db.transaction(() => {
    for (const city of cities) {
      upsert.run({
        slug: city.slug,
        display_name: city.display_name,
        is_active: city.tier < 3 ? 1 : 0,
        tier: city.tier,
        sources_json: JSON.stringify(city.sources),
      });
    }
  });

  upsertAll();
  console.log(`[DB] Synced ${cities.length} cities from config`);
}

export default db;
