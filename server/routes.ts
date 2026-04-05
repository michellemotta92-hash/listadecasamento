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

  // Expire overdue reservations before returning gifts
  await query(
    "UPDATE gift_reservations SET status = 'expirada', updated_at = NOW() WHERE status = 'pendente' AND expires_at < NOW()"
  );
  await query(
    "UPDATE gift_items SET status = 'disponivel', updated_at = NOW() WHERE status = 'reservado' AND id IN (SELECT gift_item_id FROM gift_reservations WHERE status = 'expirada')"
  );

  const gifts = await query(
    'SELECT * FROM gift_items WHERE tenant_id = $1 ORDER BY sort_order ASC, created_at ASC',
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
  const allowed = ['name', 'description', 'price', 'room', 'color', 'store_name', 'store_link', 'status', 'is_featured', 'image_url', 'sort_order'];
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
  // Get max sort_order for new items
  const maxOrder = await queryOne<{ max: number }>('SELECT COALESCE(MAX(sort_order), 0) as max FROM gift_items WHERE tenant_id = $1', [tenantId]);
  const nextOrder = (maxOrder?.max || 0) + 1;
  const gift = await queryOne(
    `INSERT INTO gift_items (tenant_id, name, description, price, room, color, store_name, store_link, status, is_featured, image_url, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [tenantId, g.name, g.description, g.price, g.room, g.color, g.store_name, g.store_link, g.status || 'disponivel', g.is_featured || false, g.image_url, nextOrder]
  );
  res.json(gift);
});

api.post('/gifts/reorder', async (req: Request, res: Response) => {
  const { orderedIds } = req.body as { orderedIds: string[] };
  if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds required' });

  for (let i = 0; i < orderedIds.length; i++) {
    await query('UPDATE gift_items SET sort_order = $1, updated_at = NOW() WHERE id = $2', [i, orderedIds[i]]);
  }
  res.json({ ok: true });
});

api.delete('/gifts/:id', async (req: Request, res: Response) => {
  await query('DELETE FROM gift_items WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
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
  const user = await queryOne<{ id: string; username: string; name: string }>(
    'SELECT id, username, name FROM admin_users WHERE username = $1 AND password = $2',
    [email, password]
  );
  if (user) {
    return res.json({ ok: true, token: 'parasempre-admin-token', user });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// ─── Admin Users ───────────────────────────────────────

api.get('/admin-users', async (_req: Request, res: Response) => {
  const users = await query(
    'SELECT id, username, name, created_at FROM admin_users ORDER BY created_at ASC'
  );
  res.json(users);
});

api.post('/admin-users', async (req: Request, res: Response) => {
  const { username, password, name } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  try {
    const user = await queryOne(
      'INSERT INTO admin_users (username, password, name) VALUES ($1, $2, $3) RETURNING id, username, name, created_at',
      [username, password, name || username]
    );
    res.json(user);
  } catch (e: any) {
    if (e.code === '23505') return res.status(400).json({ error: 'Username already exists' });
    res.status(500).json({ error: 'Failed to create user' });
  }
});

api.patch('/admin-users/:id', async (req: Request, res: Response) => {
  const { username, password, name } = req.body;
  const sets: string[] = [];
  const values: any[] = [];
  let i = 1;
  if (username) { sets.push(`username = $${i++}`); values.push(username); }
  if (password) { sets.push(`password = $${i++}`); values.push(password); }
  if (name !== undefined) { sets.push(`name = $${i++}`); values.push(name); }
  if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.params.id);
  try {
    await query(`UPDATE admin_users SET ${sets.join(', ')} WHERE id = $${i}`, values);
    res.json({ ok: true });
  } catch (e: any) {
    if (e.code === '23505') return res.status(400).json({ error: 'Username already exists' });
    res.status(500).json({ error: 'Failed to update user' });
  }
});

api.delete('/admin-users/:id', async (req: Request, res: Response) => {
  const count = await query('SELECT count(*) as cnt FROM admin_users');
  if (parseInt((count as any)[0]?.cnt) <= 1) {
    return res.status(400).json({ error: 'Cannot delete the last admin user' });
  }
  await query('DELETE FROM admin_users WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// ─── Image Upload (stored in database) ─────────────────

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from './db.js';

const memStorage = multer.memoryStorage();
const upload = multer({
  storage: memStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
});

// Save image buffer to database, return URL path
async function saveImageToDb(buffer: Buffer, mimeType: string, suggestedName?: string): Promise<string> {
  const ext = mimeType.includes('png') ? '.png' : mimeType.includes('webp') ? '.webp' : '.jpg';
  const filename = suggestedName || `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
  const urlPath = `/db-images/${filename}`;

  await pool.query(
    `INSERT INTO uploaded_images (path, mime_type, data) VALUES ($1, $2, $3)
     ON CONFLICT (path) DO UPDATE SET data = $3, mime_type = $2`,
    [urlPath, mimeType, buffer]
  );
  return urlPath;
}

// Upload endpoint - stores in DB
api.post('/upload', upload.single('image'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  try {
    const url = await saveImageToDb(req.file.buffer, req.file.mimetype);
    res.json({ url });
  } catch (e: any) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ─── Regenerate Image ──────────────────────────────────

function fetchUrl(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? require('https') : require('http');
    mod.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 10000,
    }, (r: any) => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        return fetchUrl(r.headers.location).then(resolve).catch(reject);
      }
      if (r.statusCode !== 200) return reject(new Error(`HTTP ${r.statusCode}`));
      const chunks: Buffer[] = [];
      r.on('data', (c: Buffer) => chunks.push(c));
      r.on('end', () => resolve(Buffer.concat(chunks)));
      r.on('error', reject);
    }).on('error', reject);
  });
}

api.post('/gifts/:id/regenerate-image', async (req: Request, res: Response) => {
  const gift = await queryOne<{ id: string; name: string }>('SELECT id, name FROM gift_items WHERE id = $1', [req.params.id]);
  if (!gift) return res.status(404).json({ error: 'Gift not found' });

  try {
    const searchQuery = encodeURIComponent(`${gift.name} produto`);
    const bingUrl = `https://www.bing.com/images/search?q=${searchQuery}&first=1&count=5&qft=+filterui:photo-photo`;

    const html = (await fetchUrl(bingUrl)).toString('utf-8');

    const urls: string[] = [];
    const re = /murl&quot;:&quot;(https?:\/\/[^&]+?)&quot;/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const imgUrl = m[1].replace(/&amp;/g, '&');
      if (imgUrl.match(/\.(jpg|jpeg|png|webp)/i)) urls.push(imgUrl);
    }

    if (urls.length === 0) return res.status(404).json({ error: 'No images found' });

    for (const imgUrl of urls.slice(0, 3)) {
      try {
        const buffer = await fetchUrl(imgUrl);
        if (buffer.length < 5000) continue;

        const newUrl = await saveImageToDb(buffer, 'image/jpeg');
        await query('UPDATE gift_items SET image_url = $1, updated_at = NOW() WHERE id = $2', [newUrl, gift.id]);
        return res.json({ ok: true, image_url: newUrl });
      } catch {
        continue;
      }
    }

    res.status(404).json({ error: 'Could not download any image' });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to regenerate image' });
  }
});
