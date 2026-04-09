import { Router } from 'express';
import nodemailer from 'nodemailer';

const router = Router();

const VALID_REASONS = new Set(['Wrong info', 'Outdated', 'Not local', 'Other']);

interface FlagBody {
  title?: unknown;
  city_slug?: unknown;
  date?: unknown;
  reason?: unknown;
  note?: unknown;
}

function createTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT ?? 587);

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

// POST /api/flag
// Body: { title, city_slug, date, reason, note? }
// Emails ADMIN_EMAIL with flag details. Returns { ok: true }.
router.post('/', async (req, res) => {
  const body = req.body as FlagBody;

  const title    = typeof body.title    === 'string' ? body.title.trim()    : '';
  const citySlug = typeof body.city_slug === 'string' ? body.city_slug.trim() : '';
  const date     = typeof body.date     === 'string' ? body.date.trim()     : '';
  const reason   = typeof body.reason   === 'string' ? body.reason.trim()   : '';
  const note     = typeof body.note     === 'string' ? body.note.slice(0, 100).trim() : '';

  if (!title || !citySlug || !date || !VALID_REASONS.has(reason)) {
    res.status(400).json({ error: 'Missing or invalid fields' });
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL;

  if (adminEmail) {
    const transport = createTransport();
    if (transport) {
      const subject = `[nearly] Flag: ${reason} — ${title.slice(0, 60)}`;
      const text = [
        `Story flagged on nearly.`,
        ``,
        `Title:    ${title}`,
        `City:     ${citySlug}`,
        `Date:     ${date}`,
        `Reason:   ${reason}`,
        note ? `Note:     ${note}` : null,
      ].filter(Boolean).join('\n');

      try {
        await transport.sendMail({ from: adminEmail, to: adminEmail, subject, text });
      } catch (err) {
        // Log but don't fail the request — flag is still recorded in logs
        console.error('[FLAG] Email failed:', (err as Error).message);
      }
    } else {
      console.warn('[FLAG] SMTP not configured — logging flag instead');
    }
  }

  console.log(`[FLAG] ${citySlug} ${date} — ${reason}${note ? ` | "${note}"` : ''} | ${title}`);

  res.json({ ok: true });
});

export default router;
