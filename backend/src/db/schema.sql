-- Raw content fetched from sources, before AI processing
CREATE TABLE IF NOT EXISTS raw_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  city_slug    TEXT    NOT NULL,
  source_type  TEXT    NOT NULL CHECK(source_type IN ('newsapi','rss','twitter')),
  source_name  TEXT    NOT NULL,
  title        TEXT    NOT NULL,
  url          TEXT,
  raw_text     TEXT,
  content_hash TEXT    NOT NULL UNIQUE,  -- SHA256 of (title + source_name), dedup key
  fetched_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- AI-generated daily digests, one row per city per day
CREATE TABLE IF NOT EXISTS digests (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  city_slug    TEXT    NOT NULL,
  digest_date  TEXT    NOT NULL,          -- YYYY-MM-DD (IST)
  items_json   TEXT    NOT NULL,          -- JSON array of DigestItem
  generated_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(city_slug, digest_date)
);

-- City configuration (source of truth for which cities are active)
CREATE TABLE IF NOT EXISTS cities (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT    NOT NULL UNIQUE,  -- e.g. "bangalore", "delhi"
  display_name TEXT    NOT NULL,         -- e.g. "Bangalore"
  is_active    INTEGER NOT NULL DEFAULT 1,
  sources_json TEXT    NOT NULL          -- JSON array of SourceConfig
);

-- Web Push subscriptions — one row per (endpoint, city_slug) pair
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint   TEXT    NOT NULL,
  keys_json  TEXT    NOT NULL,   -- JSON { p256dh, auth }
  city_slug  TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(endpoint, city_slug)
);

-- Registered users for personalisation (auth is opt-in, digest pages stay public)
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  city_slug     TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Full-text search index over digest items (title + summary)
-- Populated and kept in sync by digestService.upsertDigest
CREATE VIRTUAL TABLE IF NOT EXISTS digests_fts USING fts5(
  title,
  summary,
  city_slug UNINDEXED,
  digest_date UNINDEXED,
  item_index UNINDEXED,
  tokenize='porter unicode61'
);

CREATE INDEX IF NOT EXISTS idx_raw_items_city_fetched ON raw_items(city_slug, fetched_at);
CREATE INDEX IF NOT EXISTS idx_digests_city_date ON digests(city_slug, digest_date);
