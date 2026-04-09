import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthedRequest extends Request {
  user?: { id: number; email: string };
}

interface JwtPayload {
  sub: number;
  email: string;
}

function isJwtPayload(v: unknown): v is JwtPayload {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Record<string, unknown>).sub === 'number' &&
    typeof (v as Record<string, unknown>).email === 'string'
  );
}

// Validates Bearer JWT, attaches user to req. Returns 401 on any failure.
export function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header missing' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'JWT_SECRET not configured' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, secret);
    if (!isJwtPayload(payload)) throw new Error('Unexpected payload shape');
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
