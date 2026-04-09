import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/client.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import type { AuthedRequest } from '../middleware/authMiddleware.js';

const router = Router();

const BCRYPT_ROUNDS = 12;
const TOKEN_TTL = '30d';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  city_slug: string | null;
  created_at: string;
}

function makeToken(user: { id: number; email: string; city_slug: string | null }): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');
  return jwt.sign(
    { sub: user.id, email: user.email, city_slug: user.city_slug },
    secret,
    { expiresIn: TOKEN_TTL },
  );
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password, city_slug } = req.body as {
    email?: unknown;
    password?: unknown;
    city_slug?: unknown;
  };

  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
    res.status(400).json({ error: 'Invalid email' });
    return;
  }
  if (typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  const normalEmail = email.trim().toLowerCase();
  const citySlug = typeof city_slug === 'string' && city_slug.trim() ? city_slug.trim() : null;

  const existing = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(normalEmail);

  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const result = db
    .prepare('INSERT INTO users (email, password_hash, city_slug) VALUES (?, ?, ?)')
    .run(normalEmail, password_hash, citySlug);

  const token = makeToken({ id: Number(result.lastInsertRowid), email: normalEmail, city_slug: citySlug });
  res.status(201).json({ token });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body as { email?: unknown; password?: unknown };

  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const user = db
    .prepare('SELECT id, email, password_hash, city_slug FROM users WHERE email = ?')
    .get(email.trim().toLowerCase()) as UserRow | undefined;

  // Constant-time comparison even if user not found
  const hash = user?.password_hash ?? '$2a$12$invalidhashpaddingtomimicbcrypt';
  const match = await bcrypt.compare(password, hash);

  if (!user || !match) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = makeToken({ id: user.id, email: user.email, city_slug: user.city_slug });
  res.json({ token });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req: AuthedRequest, res) => {
  const user = db
    .prepare('SELECT id, email, city_slug, created_at FROM users WHERE id = ?')
    .get(req.user!.id) as Omit<UserRow, 'password_hash'> | undefined;

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json(user);
});

export default router;
