import express from 'express';
import path from 'path';
import { api } from './routes.js';
import { pool } from './db.js';
import { expireOverdueReservations } from './reservations.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001');
const CORS_ORIGIN = process.env.CORS_ORIGIN;
const isDev = process.env.NODE_ENV !== 'production';
const allowedOrigins = (CORS_ORIGIN || '').split(',').map((origin) => origin.trim()).filter(Boolean);

if (!isDev && allowedOrigins.length === 0) {
  throw new Error('CORS_ORIGIN is required in production');
}

app.set('trust proxy', Number.parseInt(process.env.TRUST_PROXY_HOPS || '1', 10));

app.use(express.json({ limit: '100kb' }));

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  if (requestOrigin && (isDev || allowedOrigins.includes(requestOrigin))) {
    res.header('Access-Control-Allow-Origin', requestOrigin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-Slug');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.header('X-Frame-Options', 'SAMEORIGIN');
  res.header(
    'Content-Security-Policy',
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self'"
  );
  if (req.method === 'OPTIONS') {
    if (requestOrigin && !isDev && !allowedOrigins.includes(requestOrigin)) return res.sendStatus(403);
    return res.sendStatus(204);
  }
  next();
});

app.use('/api', api);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

app.use('/api', (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled API error:', err.message);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.get('/db-images/:filename', async (req, res) => {
  try {
    const urlPath = `/db-images/${req.params.filename}`;
    const result = await pool.query(
      'SELECT data, mime_type FROM uploaded_images WHERE path = $1',
      [urlPath]
    );
    if (result.rows.length === 0) {
      return res.status(404).send('Image not found');
    }
    const { data, mime_type } = result.rows[0];
    res.set('Content-Type', mime_type);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(data);
  } catch {
    res.status(500).send('Error loading image');
  }
});

app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath, {
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    if (filePath.includes(`${path.sep}assets${path.sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

app.use((_req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(distPath, 'index.html'));
});

async function runExpireJob() {
  try {
    const { expired, released } = await expireOverdueReservations();
    if (expired > 0) {
      console.log(`Reservas expiradas: ${expired}, presentes liberados: ${released}`);
    }
  } catch (e) {
    console.error('Erro ao expirar reservas:', e);
  }
}

const expireJobTimer = setInterval(runExpireJob, 60_000);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  runExpireJob();
});

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  clearInterval(expireJobTimer);
  console.log(`${signal} received. Shutting down gracefully...`);

  const forceExitTimer = setTimeout(() => {
    console.error('Graceful shutdown timed out.');
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  server.close(async (error) => {
    if (error) console.error('HTTP server shutdown error:', error);
    try {
      await pool.end();
    } catch (poolError) {
      console.error('Database pool shutdown error:', poolError);
    } finally {
      clearTimeout(forceExitTimer);
      process.exit(error ? 1 : 0);
    }
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
