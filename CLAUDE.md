CLAUDE.md — AI Local Feed Project

This file is read automatically by Claude Code at the start of every session. 
Do not delete or rename it. Update it when architecture decisions change.
⸻
Project overview

An AI-curated local news digest web app. A background worker fetches content from 
multiple sources every 6 hours, deduplicates it, runs it through Groq AI to produce 
clean summaries tagged by city, and stores structured digests. A React frontend 
serves users a "Today in your city (2 min read)" experience.
⸻
Monorepo structure

local-feed/
├── CLAUDE.md                  ← you are here
├── .env.example               ← all required env keys (never commit .env)
├── .gitignore
├── README.md
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json          ← extends base, outDir: dist, target: ES2022
│   ├── src/
│   │   ├── index.ts           ← Express server entry point (PORT from env)
│   │   ├── types.ts           ← all shared interfaces: DigestItem, City, SourceConfig, RawItem
│   │   ├── routes/
│   │   │   ├── digest.ts      ← GET /api/digest/:citySlug/:date?
│   │   │   ├── cities.ts      ← GET /api/cities
│   │   │   └── admin.ts       ← POST /api/admin/trigger-run (password-protected)
│   │   ├── services/
│   │   │   └── digestService.ts  ← query DB, format digest response
│   │   ├── worker/
│   │   │   ├── index.ts       ← worker entry point, runs cron schedule
│   │   │   ├── fetcher.ts     ← fetchNewsAPI(), fetchRSS(), deduplicateItems(), saveRawItems()
│   │   │   ├── summarizer.ts  ← summarizeForCity(rawItems, city) → DigestItem[]
│   │   │   └── scheduler.ts   ← node-cron: runs full pipeline every 6h
│   │   ├── db/
│   │   │   ├── client.ts      ← exports initialized better-sqlite3 instance
│   │   │   └── schema.sql     ← CREATE TABLE statements (source of truth)
│   │   └── config/
│   │       └── cities.ts      ← city definitions array (see Cities config below)
│   └── tests/
│       ├── fetcher.test.ts
│       └── summarizer.test.ts
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json          ← extends base, jsx: react-jsx, strict: true
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── types.ts           ← shared frontend types (mirrors backend DigestItem, City)
│       ├── pages/
│       │   ├── Home.tsx       ← city selector landing page
│       │   ├── Digest.tsx     ← main digest feed for a city
│       │   └── Archive.tsx    ← past digests by date
│       ├── components/
│       │   ├── DigestCard.tsx ← single news item card
│       │   ├── CityPicker.tsx
│       │   ├── FilterBar.tsx  ← filter by category/source
│       │   └── AdminPanel.tsx ← password-gated trigger + preview
│       ├── hooks/
│       │   └── useDigest.ts   ← fetches /api/digest/:city/:date
│       └── lib/
│           └── api.ts         ← all fetch() calls to backend, base URL from env
│
└── infra/
    ├── vercel.json            ← frontend deploy config
    └── railway.toml           ← backend + worker deploy config

⸻
Database schema

Single SQLite file at backend/data/localfeed.db (path from DB_PATH env var). 
Use better-sqlite3 (synchronous, no async complexity).

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
  items_json   TEXT    NOT NULL,          -- JSON array of DigestItem (see below)
  generated_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(city_slug, digest_date)
);

-- City configuration (source of truth for which cities are active)
CREATE TABLE IF NOT EXISTS cities (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT    NOT NULL UNIQUE,  -- e.g. "bangalore", "delhi"
  display_name TEXT    NOT NULL,         -- e.g. "Bangalore"
  is_active    INTEGER NOT NULL DEFAULT 1,
  sources_json TEXT    NOT NULL          -- JSON array of SourceConfig (see below)
);

CREATE INDEX IF NOT EXISTS idx_raw_items_city_fetched ON raw_items(city_slug, fetched_at);
CREATE INDEX IF NOT EXISTS idx_digests_city_date ON digests(city_slug, digest_date);


DigestItem shape (stored in digests.items_json)

{
  "title": "BMTC launches 20 new electric buses on Outer Ring Road",
  "summary": "Bangalore's transport authority added 20 electric buses to the ORR corridor, cutting average wait time by 8 minutes during peak hours.",
  "category": "civic",
  "source_name": "The Hindu Bangalore",
  "source_url": "https://...",
  "city_slug": "bangalore",
  "relevance_score": 0.91
}


Valid categories: civic, traffic, politics, weather, business, crime, culture.

SourceConfig shape (stored in cities.sources_json)

[
  { "type": "newsapi", "query": "Bangalore city news", "language": "en" },
  { "type": "rss", "url": "https://bangaloremirror.indiatimes.com/rss.cms", "name": "Bangalore Mirror" },
  { "type": "rss", "url": "https://www.thehindu.com/news/cities/bangalore/feeder/default.rss", "name": "The Hindu Blr" }
]

⸻
Environment variables

All secrets live in .env (never committed). The .env.example lists every key.

# API Keys
NEWSAPI_KEY=              # newsapi.org free tier (100 req/day)
GROQ_API_KEY=             # console.groq.com — use llama-3.3-70b-versatile

# Server
PORT=3001
ADMIN_PASSWORD=           # plain string, checked in admin route middleware

# Database
DB_PATH=./data/localfeed.db

# Frontend (Vite)
VITE_API_BASE_URL=http://localhost:3001

⸻
API contracts

All responses are JSON. Dates are YYYY-MM-DD strings in IST.

GET /api/cities
Returns all active cities.
[{ "slug": "bangalore", "display_name": "Bangalore" }]


GET /api/digest/:citySlug/:date?
date defaults to today (IST). Returns the digest for that city and date.
{
  "city": "bangalore",
  "date": "2025-08-20",
  "generated_at": "2025-08-20T08:14:00Z",
  "items": [ ...DigestItem[] ]
}

Returns 404 with { "error": "No digest found" } if not yet generated.

POST /api/admin/trigger-run
Header: x-admin-password: <ADMIN_PASSWORD>. 
Body: { "citySlug": "bangalore" } or omit for all cities. 
Triggers the worker pipeline immediately. Returns { "status": "triggered" }.
⸻
AI summarizer — Groq call spec

Model: llama-3.3-70b-versatile 
Max tokens per call: 1500 
Max raw items per call: 30 (batch if more)

System prompt (keep exactly this, do not shorten):
You are a local news editor. Given raw news items for a city, return a clean daily digest.
Output ONLY a valid JSON array. No markdown, no explanation, no preamble.
Each item must have: title (string), summary (2 sentences max), category (one of: civic/traffic/politics/weather/business/crime/culture), source_name (string), source_url (string), city_slug (string), relevance_score (float 0-1).
Remove duplicates, promotional content, and national news not relevant to the city.
Sort by relevance_score descending. Return 5-8 items maximum.


User prompt format:
City: {{city.display_name}}
Date: {{YYYY-MM-DD}}
Raw items:
{{JSON.stringify(rawItems.slice(0, 30))}}


Error handling: if Groq returns non-JSON or parse fails, log the error, save nothing for that run, and retry once after 60 seconds.
⸻
Cities config (backend/src/config/cities.ts)

This file is the bootstrap for the cities DB table. On server start, if the table is empty, seed it from this config. Adding a new city = adding one object here and running the seed.

import type { CityConfig } from '../types';

const cities: CityConfig[] = [
  {
    slug: 'bangalore',
    display_name: 'Bangalore',
    sources: [
      { type: 'newsapi', query: 'Bangalore city news', language: 'en' },
      { type: 'rss', url: 'https://bangaloremirror.indiatimes.com/rss.cms', name: 'Bangalore Mirror' },
      { type: 'rss', url: 'https://www.thehindu.com/news/cities/bangalore/feeder/default.rss', name: 'The Hindu Blr' },
    ],
  },
  {
    slug: 'delhi',
    display_name: 'Delhi',
    sources: [
      { type: 'newsapi', query: 'Delhi city news', language: 'en' },
      { type: 'rss', url: 'https://timesofindia.indiatimes.com/rssfeeds/2647163.cms', name: 'TOI Delhi' },
    ],
  },
  {
    slug: 'mumbai',
    display_name: 'Mumbai',
    sources: [
      { type: 'newsapi', query: 'Mumbai city news', language: 'en' },
      { type: 'rss', url: 'https://www.mid-day.com/rss/news', name: 'Mid-Day' },
    ],
  },
];

export default cities;

⸻
Worker pipeline execution order

When the worker runs for a city, it must execute in this exact order:

1. Load city config from DB (cities table)
2. Fetch raw items from all sources (fetcher.fetchNewsAPI, fetcher.fetchRSS)
3. Deduplicate against existing raw_items hashes for that city (last 24h window)
4. Save new raw items to raw_items table
5. Load all raw items for that city from last 6h
6. Call summarizer.summarizeForCity(items, city) → DigestItem[]
7. Upsert into digests table (INSERT OR REPLACE on city_slug + digest_date)
8. Log: [DONE] bangalore — 7 items — 2025-08-20

If any step throws, catch it, log [ERROR] <city> <step> <message>, and continue to next city.
⸻
TypeScript config

TypeScript is used throughout — both backend and frontend. No plain .js or .jsx files anywhere in src/.

Backend tsconfig.json:
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}


Frontend tsconfig.json:
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}


Shared types — define all interfaces in src/types.ts for each package. Do not use any. Use unknown for Groq API raw responses and narrow before use.

Key interfaces to define in backend/src/types.ts:
export type SourceType = 'newsapi' | 'rss' | 'twitter';
export type DigestCategory = 'civic' | 'traffic' | 'politics' | 'weather' | 'business' | 'crime' | 'culture';

export interface SourceConfig {
  type: SourceType;
  query?: string;      // newsapi only
  url?: string;        // rss only
  name?: string;
  language?: string;
}

export interface CityConfig {
  slug: string;
  display_name: string;
  sources: SourceConfig[];
}

export interface RawItem {
  id?: number;
  city_slug: string;
  source_type: SourceType;
  source_name: string;
  title: string;
  url?: string;
  raw_text?: string;
  content_hash: string;
  fetched_at?: string;
}

export interface DigestItem {
  title: string;
  summary: string;
  category: DigestCategory;
  source_name: string;
  source_url: string;
  city_slug: string;
  relevance_score: number;
}

⸻
Naming conventions

- Files: camelCase.ts for backend, camelCase.ts / PascalCase.tsx for frontend
- DB columns: snake_case
- API routes: kebab-case slugs only
- React components: PascalCase.tsx
- Non-component frontend files: camelCase.ts
- Env vars: SCREAMING_SNAKE_CASE
- Git branches: feature/<module-name>, e.g. feature/fetcher
⸻
Key dependencies

Backend
{
  "express": "^4.18",
  "better-sqlite3": "^9",
  "node-cron": "^3",
  "rss-parser": "^3",
  "axios": "^1",
  "groq-sdk": "^0.3"
}

{
  "devDependencies": {
    "typescript": "^5",
    "tsx": "^4",
    "@types/express": "^4",
    "@types/better-sqlite3": "^7",
    "@types/node-cron": "^3",
    "@types/node": "^20"
  }
}

Run backend in dev with tsx watch src/index.ts. Build with tsc.

Frontend
{
  "react": "^18",
  "react-dom": "^18",
  "vite": "^5",
  "@vitejs/plugin-react": "^4",
  "react-router-dom": "^6"
}

{
  "devDependencies": {
    "typescript": "^5",
    "@types/react": "^18",
    "@types/react-dom": "^18"
  }
}

⸻
What NOT to do

- Do not use async fs — use better-sqlite3 synchronous API only
- Do not add any auth/login for regular users — digest is public
- Do not write plain .js or .jsx files anywhere in src/ — TypeScript only
- Do not use any — use unknown and narrow, or define a proper interface
- Do not install Prisma or any ORM — raw SQL via better-sqlite3 only
- Do not add Redis or any external cache — SQLite is sufficient for v1
- Do not call Groq with more than 30 items at once — batch if needed
- Do not commit .env or data/localfeed.db — both are in .gitignore
- Do not change the Groq system prompt without updating this file
⸻
Deployment targets

- Frontend → Vercel (free tier), root: /frontend, build: npm run build, output: dist/
- Backend API → Railway, root: /backend, build: tsc, start: node dist/index.js
- Worker → Railway (separate service), root: /backend, build: tsc, start: node dist/worker/index.js
- DB file lives on Railway persistent volume mounted at /data
⸻
Current build status

- [ ] Scaffold (folders, package.json, tsconfig.json files, schema.sql, env.example)
- [ ] backend/src/types.ts — all shared interfaces
- [ ] frontend/src/types.ts — frontend-facing interfaces
- [ ] fetcher.ts
- [ ] summarizer.ts
- [ ] scheduler.ts + worker/index.ts
- [ ] DB client + schema init
- [ ] Express routes (digest, cities, admin)
- [ ] digestService.ts
- [ ] React pages (Home, Digest, Archive) — .tsx
- [ ] React components (DigestCard, CityPicker, FilterBar) — .tsx
- [ ] Deploy configs (vercel.json, railway.toml)
