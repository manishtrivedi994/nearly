import { Router } from 'express';
import db from '../db/client.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import type { AuthedRequest } from '../middleware/authMiddleware.js';

const router = Router();

// All routes require auth
router.use(authMiddleware);

// ─── Bookmarks ────────────────────────────────────────────────────────────────

interface BookmarkRow {
  id: number;
  title: string;
  summary: string;
  source_url: string;
  city_slug: string;
  digest_date: string;
  source_name: string;
  category: string;
  saved_at: string;
}

// GET /api/me/bookmarks
router.get('/bookmarks', (req: AuthedRequest, res) => {
  const rows = db
    .prepare('SELECT * FROM user_bookmarks WHERE user_id = ? ORDER BY saved_at DESC')
    .all(req.user!.id) as BookmarkRow[];
  res.json(rows);
});

// POST /api/me/bookmarks
router.post('/bookmarks', (req: AuthedRequest, res) => {
  const { title, summary, source_url, city_slug, digest_date, source_name, category } =
    req.body as Record<string, unknown>;

  if (
    typeof title !== 'string' ||
    typeof summary !== 'string' ||
    typeof source_url !== 'string' ||
    typeof city_slug !== 'string' ||
    typeof digest_date !== 'string'
  ) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const result = db
    .prepare(
      `INSERT OR IGNORE INTO user_bookmarks
         (user_id, title, summary, source_url, city_slug, digest_date, source_name, category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      req.user!.id,
      title,
      summary,
      source_url,
      city_slug,
      digest_date,
      typeof source_name === 'string' ? source_name : '',
      typeof category === 'string' ? category : '',
    );

  const row = db
    .prepare('SELECT * FROM user_bookmarks WHERE id = ?')
    .get(result.lastInsertRowid) as BookmarkRow | undefined;

  res.status(201).json(row ?? { id: result.lastInsertRowid });
});

// DELETE /api/me/bookmarks/:id
router.delete('/bookmarks/:id', (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: 'Invalid id' }); return; }

  const result = db
    .prepare('DELETE FROM user_bookmarks WHERE id = ? AND user_id = ?')
    .run(id, req.user!.id);

  if (result.changes === 0) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ ok: true });
});

// ─── Read dates (streak) ──────────────────────────────────────────────────────

interface ReadDateRow {
  id: number;
  read_date: string;
  city_slug: string;
}

// GET /api/me/read-dates
router.get('/read-dates', (req: AuthedRequest, res) => {
  const rows = db
    .prepare('SELECT id, read_date, city_slug FROM user_read_dates WHERE user_id = ? ORDER BY read_date DESC')
    .all(req.user!.id) as ReadDateRow[];
  res.json(rows);
});

// POST /api/me/read-dates
router.post('/read-dates', (req: AuthedRequest, res) => {
  const { read_date, city_slug } = req.body as Record<string, unknown>;

  if (typeof read_date !== 'string' || typeof city_slug !== 'string') {
    res.status(400).json({ error: 'read_date and city_slug are required' });
    return;
  }

  db.prepare(
    'INSERT OR IGNORE INTO user_read_dates (user_id, read_date, city_slug) VALUES (?, ?, ?)',
  ).run(req.user!.id, read_date, city_slug);

  res.status(201).json({ ok: true });
});

// ─── Preferences ──────────────────────────────────────────────────────────────

interface PrefRow {
  last_city: string | null;
  language: string;
}

// GET /api/me/preferences
router.get('/preferences', (req: AuthedRequest, res) => {
  const row = db
    .prepare('SELECT last_city, language FROM user_preferences WHERE user_id = ?')
    .get(req.user!.id) as PrefRow | undefined;
  res.json(row ?? { last_city: null, language: 'en' });
});

// PATCH /api/me/preferences
router.patch('/preferences', (req: AuthedRequest, res) => {
  const { last_city, language } = req.body as Record<string, unknown>;

  const existing = db
    .prepare('SELECT id FROM user_preferences WHERE user_id = ?')
    .get(req.user!.id);

  if (!existing) {
    db.prepare(
      `INSERT INTO user_preferences (user_id, last_city, language)
       VALUES (?, ?, ?)`,
    ).run(
      req.user!.id,
      typeof last_city === 'string' ? last_city : null,
      typeof language === 'string' ? language : 'en',
    );
  } else {
    const updates: string[] = [];
    const values: unknown[] = [];
    if (last_city !== undefined) { updates.push('last_city = ?'); values.push(typeof last_city === 'string' ? last_city : null); }
    if (language !== undefined) { updates.push('language = ?'); values.push(language); }
    if (updates.length > 0) {
      updates.push('updated_at = datetime(\'now\')');
      values.push(req.user!.id);
      db.prepare(`UPDATE user_preferences SET ${updates.join(', ')} WHERE user_id = ?`).run(...values);
    }
  }

  const row = db
    .prepare('SELECT last_city, language FROM user_preferences WHERE user_id = ?')
    .get(req.user!.id) as PrefRow;
  res.json(row);
});

export default router;
