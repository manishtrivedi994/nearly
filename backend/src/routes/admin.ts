import { Router } from 'express';
import db from '../db/client.js';
import { runPipelineForCity } from '../worker/scheduler.js';
import type { CityConfig, SourceConfig } from '../types.js';

const router = Router();

interface CityRow {
  slug: string;
  display_name: string;
  tier: number;
  sources_json: string;
}

function loadCity(slug: string): CityConfig | null {
  const row = db
    .prepare('SELECT slug, display_name, tier, sources_json FROM cities WHERE slug = ? AND is_active = 1')
    .get(slug) as CityRow | undefined;

  if (!row) return null;

  return {
    slug: row.slug,
    display_name: row.display_name,
    tier: row.tier as 1 | 2 | 3,
    sources: JSON.parse(row.sources_json) as SourceConfig[],
  };
}

function loadAllActiveCities(): CityConfig[] {
  const rows = db
    .prepare('SELECT slug, display_name, tier, sources_json FROM cities WHERE is_active = 1 ORDER BY tier ASC')
    .all() as CityRow[];

  return rows.map((row) => ({
    slug: row.slug,
    display_name: row.display_name,
    tier: row.tier as 1 | 2 | 3,
    sources: JSON.parse(row.sources_json) as SourceConfig[],
  }));
}

// POST /api/admin/trigger-run
// Requires header: x-admin-password
// Body (optional): { "citySlug": "bangalore" }  — omit to run all cities
// Triggers the pipeline in the background; responds immediately with { status: 'triggered' }
router.post('/trigger-run', (req, res) => {
  const provided = req.headers['x-admin-password'];
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || provided !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { citySlug } = req.body as { citySlug?: string };

  if (citySlug) {
    const city = loadCity(citySlug);
    if (!city) {
      res.status(404).json({ error: `City '${citySlug}' not found or inactive` });
      return;
    }

    runPipelineForCity(city, db).catch((err: unknown) => {
      console.error(`[ERROR] admin trigger ${citySlug}:`, (err as Error).message);
    });
  } else {
    const cities = loadAllActiveCities();
    for (const city of cities) {
      runPipelineForCity(city, db).catch((err: unknown) => {
        console.error(`[ERROR] admin trigger ${city.slug}:`, (err as Error).message);
      });
    }
  }

  res.json({ status: 'triggered' });
});

export default router;
