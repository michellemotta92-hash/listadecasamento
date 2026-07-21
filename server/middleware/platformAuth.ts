import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from './auth.js';

export interface PlatformAuthPayload {
  userId: string;
  email: string;
  type: 'platform';
}

declare global {
  namespace Express {
    interface Request {
      platformAuth?: PlatformAuthPayload;
    }
  }
}

export function signPlatformToken(payload: Omit<PlatformAuthPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'platform' }, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyPlatformToken(token: string): PlatformAuthPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as PlatformAuthPayload;
    if (decoded.type !== 'platform') return null;
    return decoded;
  } catch {
    return null;
  }
}

export function requirePlatformAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Não autorizado' });
    return;
  }
  const payload = verifyPlatformToken(header.slice(7));
  if (!payload) {
    res.status(401).json({ error: 'Sessão inválida ou expirada' });
    return;
  }
  req.platformAuth = payload;
  next();
}
