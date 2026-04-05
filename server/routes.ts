import { Router, Request, Response } from 'express';
import { query, queryOne } from './db.js';

export const api = Router();

// ─── Helper ─────────────────────────────────────────────
async function getTenantId(slug: string): Promise<string | null> {
  const t = await queryOne<{ id: string }>('SELECT id FROM tenants WHERE slug = $1', [slug]);
  return t?.id || null;
}

// ─── Gifts ──────────────────────────────────────────────

api.get('/gifts', async (req: Request, res: Response) => {
  const tenantId = await getTenantId('miejohn');
  if (!tenantId) return res.json([]);
  const gifts = await query(
    'SELECT * FROM gift_items WHERE tenant_id = $1 ORDER BY created_at ASC',
    [tenantId]
  );
  res.json(gifts);
});

api.get('/gifts/:id', async (req: Request, res: Response) => {
  const gift = await queryOne('SELECT * FROM gift_items WHERE id = $1', [req.params.id]);
  if (!gift) return res.status(404).json({ error: 'Not found' });
  res.json(gift);
});

api.patch('/gifts/:id', async (req: Request, res: Response) => {
  const updates = req.body;
  const allowed = ['name', 'description', 'price', 'room', 'color', 'store_name', 'store_link', 'status', 'is_featured', 'image_url'];
  const sets: string[] = [];
  const values: any[] = [];
  let i = 1;

  for (const key of allowed) {
    if (key in updates) {
      sets.push(`${key} = $${i}`);
      values.push(updates[key]);
      i++;
    }
  }

  if (sets.length === 0) return res.status(400).json({ error: 'No valid fields' });

  sets.push(`updated_at = NOW()`);
  values.push(req.params.id);

  await query(
    `UPDATE gift_items SET ${sets.join(', ')} WHERE id = $${i}`,
    values
  );
  res.json({ ok: true });
});

api.post('/gifts', async (req: Request, res: Response) => {
  const tenantId = await getTenantId('miejohn');
  if (!tenantId) return res.status(500).json({ error: 'No tenant' });

  const g = req.body;
  const gift = await queryOne(
    `INSERT INTO gift_items (tenant_id, name, description, price, room, color, store_name, store_link, status, is_featured, image_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [tenantId, g.name, g.description, g.price, g.room, g.color, g.store_name, g.store_link, g.status || 'disponivel', g.is_featured || false, g.image_url]
  );
  res.json(gift);
});

// ─── Reservations ───────────────────────────────────────

api.get('/reservations', async (req: Request, res: Response) => {
  const tenantId = await getTenantId('miejohn');
  if (!tenantId) return res.json([]);
  const reservations = await query(
    'SELECT r.*, g.name as gift_name FROM gift_reservations r LEFT JOIN gift_items g ON g.id = r.gift_item_id WHERE r.tenant_id = $1 ORDER BY r.created_at DESC',
    [tenantId]
  );
  res.json(reservations);
});

api.post('/reservations', async (req: Request, res: Response) => {
  const { gift_id } = req.body;

  // Check availability
  const gift = await queryOne<{ id: string; status: string; tenant_id: string }>(
    'SELECT id, status, tenant_id FROM gift_items WHERE id = $1',
    [gift_id]
  );
  if (!gift || gift.status !== 'disponivel') {
    return res.status(400).json({ error: 'Gift not available' });
  }

  // Update gift status
  await query('UPDATE gift_items SET status = $1, updated_at = NOW() WHERE id = $2', ['reservado', gift_id]);

  // Create reservation
  const expiresAt = new Date(Date.now() + 20 * 60000).toISOString();
  const reservation = await queryOne(
    `INSERT INTO gift_reservations (gift_item_id, tenant_id, guest_name, guest_email, status, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [gift_id, gift.tenant_id, 'Convidado', null, 'pendente', expiresAt]
  );
  res.json(reservation);
});

api.post('/reservations/:giftId/confirm', async (req: Request, res: Response) => {
  const { giftId } = req.params;

  await query('UPDATE gift_items SET status = $1, updated_at = NOW() WHERE id = $2', ['comprado', giftId]);
  await query(
    `UPDATE gift_reservations SET status = 'confirmada', updated_at = NOW()
     WHERE gift_item_id = $1 AND status = 'pendente'`,
    [giftId]
  );
  res.json({ ok: true });
});

// ─── Messages ───────────────────────────────────────────

api.get('/messages', async (req: Request, res: Response) => {
  const tenantId = await getTenantId('miejohn');
  if (!tenantId) return res.json([]);
  const approved = req.query.approved;
  let sql = 'SELECT * FROM guest_messages WHERE tenant_id = $1';
  if (approved === 'true') sql += ' AND is_approved = true';
  sql += ' ORDER BY created_at DESC';
  const messages = await query(sql, [tenantId]);
  res.json(messages);
});

api.post('/messages', async (req: Request, res: Response) => {
  const tenantId = await getTenantId('miejohn');
  if (!tenantId) return res.status(500).json({ error: 'No tenant' });

  const { guest_name, message } = req.body;
  const msg = await queryOne(
    'INSERT INTO guest_messages (tenant_id, guest_name, message) VALUES ($1, $2, $3) RETURNING *',
    [tenantId, guest_name, message]
  );
  res.json(msg);
});

api.delete('/messages/:id', async (_req: Request, res: Response) => {
  await query('DELETE FROM guest_messages WHERE id = $1', [_req.params.id]);
  res.json({ ok: true });
});

api.patch('/messages/:id/toggle', async (req: Request, res: Response) => {
  await query(
    'UPDATE guest_messages SET is_approved = NOT is_approved WHERE id = $1',
    [req.params.id]
  );
  res.json({ ok: true });
});

// ─── RSVP ───────────────────────────────────────────────

api.get('/rsvp', async (req: Request, res: Response) => {
  const tenantId = await getTenantId('miejohn');
  if (!tenantId) return res.json([]);
  const entries = await query(
    'SELECT * FROM rsvp_entries WHERE tenant_id = $1 ORDER BY created_at DESC',
    [tenantId]
  );
  res.json(entries);
});

api.post('/rsvp', async (req: Request, res: Response) => {
  const tenantId = await getTenantId('miejohn');
  if (!tenantId) return res.status(500).json({ error: 'No tenant' });

  const { guest_name, guest_email, guests_count, dietary_restrictions, message, status } = req.body;
  const entry = await queryOne(
    `INSERT INTO rsvp_entries (tenant_id, guest_name, guest_email, guests_count, dietary_restrictions, message, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [tenantId, guest_name, guest_email, guests_count || 1, dietary_restrictions, message, status || 'confirmado']
  );
  res.json(entry);
});

api.delete('/rsvp/:id', async (req: Request, res: Response) => {
  await query('DELETE FROM rsvp_entries WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// ─── Site Config ────────────────────────────────────────

api.get('/site-config', async (_req: Request, res: Response) => {
  const tenant = await queryOne<{ theme_config: any }>('SELECT theme_config FROM tenants WHERE slug = $1', ['miejohn']);
  res.json(tenant?.theme_config || {});
});

api.patch('/site-config', async (req: Request, res: Response) => {
  const tenant = await queryOne<{ theme_config: any }>('SELECT theme_config FROM tenants WHERE slug = $1', ['miejohn']);
  const current = tenant?.theme_config || {};
  const merged = { ...current, ...req.body };

  await query(
    'UPDATE tenants SET theme_config = $1, updated_at = NOW() WHERE slug = $2',
    [JSON.stringify(merged), 'miejohn']
  );
  res.json({ ok: true });
});

// ─── Auth ───────────────────────────────────────────────

api.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  // Simple auth - in production, use proper hashing
  if (email === 'admin' && password === 'admin123') {
    return res.json({ ok: true, token: 'parasempre-admin-token' });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// ─── Image Upload ───────────────────────────────────────

import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
});

api.post('/upload', upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});
