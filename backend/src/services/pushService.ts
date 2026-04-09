import webpush from 'web-push';
import type { Database } from 'better-sqlite3';

interface SubscriptionRow {
  endpoint: string;
  keys_json: string;
}

// Initialise VAPID details once — safe to call at module load time.
// All three vars must be set; if any is absent (dev / test), push is a no-op.
const VAPID_EMAIL = process.env.VAPID_EMAIL ?? '';
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? '';

const vapidReady = Boolean(VAPID_EMAIL && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);

if (vapidReady) {
  webpush.setVapidDetails(
    `mailto:${VAPID_EMAIL}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
  );
}

/**
 * Sends a push notification to every subscriber for the given city.
 * Stale/expired subscriptions (410/404) are removed from the DB automatically.
 */
export async function sendPushToCity(
  citySlug: string,
  cityDisplayName: string,
  db: Database,
): Promise<void> {
  if (!vapidReady) return;

  const rows = db
    .prepare('SELECT endpoint, keys_json FROM push_subscriptions WHERE city_slug = ?')
    .all(citySlug) as SubscriptionRow[];

  if (rows.length === 0) return;

  const payload = JSON.stringify({
    title: `Today in ${cityDisplayName} is ready`,
    body: 'Your daily digest is here. Tap to read.',
  });

  const deleteStale = db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?');

  await Promise.allSettled(
    rows.map(async (row) => {
      const keys = JSON.parse(row.keys_json) as { p256dh: string; auth: string };
      try {
        await webpush.sendNotification({ endpoint: row.endpoint, keys }, payload);
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          deleteStale.run(row.endpoint);
          console.log(`[PUSH] Removed stale subscription: ${row.endpoint.slice(0, 40)}…`);
        } else {
          console.error(`[PUSH] Error sending to ${row.endpoint.slice(0, 40)}…: ${(err as Error).message}`);
        }
      }
    }),
  );

  console.log(`[PUSH] Notified ${rows.length} subscriber(s) for ${citySlug}`);
}
