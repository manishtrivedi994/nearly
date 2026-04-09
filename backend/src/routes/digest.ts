import { Router } from 'express';
import { getDigest, getCategoryItems, getRelatedStories } from '../services/digestService.js';

const VALID_CATEGORIES = new Set([
  'civic', 'traffic', 'politics', 'weather', 'business', 'crime', 'culture',
]);

const router = Router();

function todayIST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

// GET /api/digest/:citySlug/areas
// Returns distinct non-null area values from today's digest.
// Must be registered before /:citySlug/:date? so "areas" isn't treated as a date.
router.get('/:citySlug/areas', (req, res) => {
  const { citySlug } = req.params;
  const digest = getDigest(citySlug, todayIST());

  if (!digest) {
    res.json({ areas: [] });
    return;
  }

  const areas = [
    ...new Set(
      digest.items
        .map((i) => i.area)
        .filter((a): a is string => typeof a === 'string' && a.trim() !== '' && a !== 'null'),
    ),
  ].sort();

  res.json({ areas });
});

// GET /api/digest/:citySlug/related?title=<encoded>&category=<category>
// Returns up to 3 past DigestItems matching category via FTS on title keywords.
// Must be registered before /:citySlug/:date? so "related" isn't treated as a date.
router.get('/:citySlug/related', (req, res) => {
  const { citySlug } = req.params;
  const title = typeof req.query.title === 'string' ? req.query.title.trim() : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';

  if (!title) {
    res.status(400).json({ error: 'title param is required' });
    return;
  }
  if (!VALID_CATEGORIES.has(category)) {
    res.status(400).json({ error: 'Invalid category' });
    return;
  }

  const items = getRelatedStories(citySlug, title, category);
  res.json(items);
});

// GET /api/digest/:citySlug/category/:category
// Returns last 30 days of DigestItems for that category, newest-first.
// Must be registered before /:citySlug/:date? so "category" isn't treated as a date.
router.get('/:citySlug/category/:category', (req, res) => {
  const { citySlug, category } = req.params;

  if (!VALID_CATEGORIES.has(category)) {
    res.status(400).json({ error: 'Invalid category' });
    return;
  }

  const items = getCategoryItems(citySlug, category);
  res.json(items);
});

// GET /api/digest/:citySlug/:date?
// date defaults to today in IST (YYYY-MM-DD). Returns 404 if no digest exists.
router.get('/:citySlug/:date?', (req, res) => {
  const { citySlug } = req.params;
  const date = req.params.date ?? todayIST();

  const digest = getDigest(citySlug, date);

  if (!digest) {
    res.status(404).json({ error: 'No digest found' });
    return;
  }

  res.json(digest);
});

export default router;
