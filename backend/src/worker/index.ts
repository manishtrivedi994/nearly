import cron from 'node-cron';
import db from '../db/client.js';
import { runPipelineForCity } from './scheduler.js';
import type { CityConfig, SourceConfig } from '../types.js';

interface CityRow {
  slug: string;
  display_name: string;
  sources_json: string;
}

function loadActiveCities(): CityConfig[] {
  const rows = db
    .prepare('SELECT slug, display_name, sources_json FROM cities WHERE is_active = 1')
    .all() as CityRow[];

  return rows.map((row) => ({
    slug: row.slug,
    display_name: row.display_name,
    sources: JSON.parse(row.sources_json) as SourceConfig[],
  }));
}

async function runAll(): Promise<void> {
  const cities = loadActiveCities();

  if (cities.length === 0) {
    console.warn('[WARN] No active cities found in DB — nothing to run');
    return;
  }

  console.log(`[INFO] Starting pipeline run for ${cities.length} city/cities`);

  for (const city of cities) {
    // runPipelineForCity catches its own errors so one city never blocks the next
    await runPipelineForCity(city, db);
  }

  console.log('[INFO] Pipeline run complete');
}

// Run immediately on worker start so the first digest doesn't wait 6h
runAll().catch((err: unknown) => {
  console.error('[FATAL] Initial pipeline run failed:', (err as Error).message);
});

// Schedule subsequent runs every 6 hours
cron.schedule('0 */6 * * *', () => {
  runAll().catch((err: unknown) => {
    console.error('[FATAL] Scheduled pipeline run failed:', (err as Error).message);
  });
});

console.log('[INFO] Worker started — pipeline scheduled every 6 hours (0 */6 * * *)');
