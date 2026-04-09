import { Router } from 'express';
import { searchDigests } from '../services/digestService.js';

const router = Router();

// GET /api/search?q=<query>&city=<slug>
// Returns up to 50 matching DigestItems with date and city_slug.
// city param is optional; omit to search across all cities.
router.get('/', (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const city = typeof req.query.city === 'string' ? req.query.city.trim() : undefined;

  if (q.length < 2) {
    res.status(400).json({ error: 'Query must be at least 2 characters' });
    return;
  }

  const results = searchDigests(q, city || undefined);
  res.json(results);
});

export default router;
