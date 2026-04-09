import { Router } from 'express';
import { getCities } from '../services/digestService.js';

const router = Router();

// GET /api/cities
// Returns all active cities ordered by display name.
router.get('/', (_req, res) => {
  res.json(getCities());
});

export default router;
