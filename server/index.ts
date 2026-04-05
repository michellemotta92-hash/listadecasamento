import express from 'express';
import path from 'path';
import { api } from './routes.js';
import { pool } from './db.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

app.use(express.json());

// CORS for development
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (_req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// API routes
app.use('/api', api);

// Serve uploaded images
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Serve static frontend (production)
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// SPA fallback - serve index.html for all non-API routes
app.use((_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Expire overdue reservations every 60 seconds
async function expireReservations() {
  try {
    const result = await pool.query(
      "UPDATE gift_reservations SET status = 'expirada', updated_at = NOW() WHERE status = 'pendente' AND expires_at < NOW() RETURNING gift_item_id",
    );
    if (result.rowCount && result.rowCount > 0) {
      await pool.query(
        "UPDATE gift_items SET status = 'disponivel', updated_at = NOW() WHERE status = 'reservado' AND id IN (SELECT gift_item_id FROM gift_reservations WHERE status = 'expirada')",
      );
      console.log(`Expiradas ${result.rowCount} reservas, presentes liberados.`);
    }
  } catch (e) {
    // Silently ignore DB errors (e.g. no connection yet)
  }
}
setInterval(expireReservations, 60_000);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  expireReservations(); // Run once on startup
});
