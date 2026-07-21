import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

if (process.env.NODE_ENV === 'production' && Buffer.byteLength(JWT_SECRET, 'utf8') < 32) {
  throw new Error('JWT_SECRET must contain at least 32 bytes in production');
}

export interface AuthPayload {
  userId: string;
  username: string;
  type: 'legacy-admin';
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function signToken(payload: Omit<AuthPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'legacy-admin' }, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '24h',
  });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as Partial<AuthPayload>;
    if (decoded.type !== 'legacy-admin' || !decoded.userId || !decoded.username) return null;
    return decoded as AuthPayload;
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Não autorizado' });
    return;
  }
  const token = header.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Token inválido ou expirado' });
    return;
  }
  req.auth = payload;
  next();
}

export function getJwtSecret(): string {
  return JWT_SECRET;
}
