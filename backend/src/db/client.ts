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

// Run schema DDL — all statements are IF NOT EXISTS so this is safe on every start
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// Seed cities table on first run
const cityCount = (db.prepare('SELECT COUNT(*) AS n FROM cities').get() as { n: number }).n;
if (cityCount === 0) {
  const insert = db.prepare(`
    INSERT INTO cities (slug, display_name, is_active, sources_json)
    VALUES (@slug, @display_name, 1, @sources_json)
  `);

  const seedAll = db.transaction(() => {
    for (const city of cities) {
      insert.run({
        slug: city.slug,
        display_name: city.display_name,
        sources_json: JSON.stringify(city.sources),
      });
    }
  });

  seedAll();
  console.log(`[DB] Seeded ${cities.length} cities`);
}

export default db;
