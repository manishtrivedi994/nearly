import { Router } from 'express';
import { getDigest } from '../services/digestService.js';

const router = Router();

function todayIST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

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
