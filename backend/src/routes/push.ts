import { Router } from 'express';
import type { Request, Response } from 'express';
import db from '../db/client.js';

const router = Router();

interface SubscribeBody {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  citySlug: string;
}

router.post('/subscribe', (req: Request, res: Response) => {
  const { endpoint, keys, citySlug } = req.body as Partial<SubscribeBody>;

  if (!endpoint || !keys?.p256dh || !keys?.auth || !citySlug) {
    res.status(400).json({ error: 'Missing required fields: endpoint, keys.p256dh, keys.auth, citySlug' });
    return;
  }

  db.prepare(
    `INSERT OR REPLACE INTO push_subscriptions (endpoint, keys_json, city_slug)
     VALUES (?, ?, ?)`,
  ).run(endpoint, JSON.stringify(keys), citySlug);

  res.json({ status: 'subscribed' });
});

export default router;
