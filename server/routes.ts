import { Router, Request, Response } from 'express';
import https from 'https';
import http from 'http';
import multer from 'multer';
import bcrypt from 'bcrypt';
import { query, queryOne, pool } from './db.js';
import { resolveTenantSlug, isValidSlug, normalizeSlug } from './tenant.js';
import { platformApi } from './platform.js';
import {
  confirmReservationTransaction,
  createReservationTransaction,
} from './reservations.js';
import {
  validateGuestName,
  validateGuestEmail,
  validateMessage,
  validateGuestsCount,
  validateHttpsUrl,
  trimString,
} from './validation.js';
import { requirePlatformAuth } from './middleware/platformAuth.js';
import { requireTenantAccess, requireTenantEditor } from './middleware/tenantAccess.js';
import { requireAuth, signToken } from './middleware/auth.js';
import { publicWriteLimiter } from './middleware/rateLimit.js';
import { writeAuditLog } from './audit.js';

export const api = Router();

api.use('/platform', platformApi);

const legacyAdminDisabled = (_req: Request, res: Response): void => {
  res.status(410).json({ error: 'Use o login da plataforma em /app/login.' });
};

const imageRegenerationDisabled = (_req: Request, res: Response): void => {
  res.status(501).json({
    error: 'Geração automática de imagens estará disponível com um provedor seguro configurado.',
    code: 'IMAGE_PROVIDER_NOT_CONFIGURED',
  });
};

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  return stored.startsWith('$2') && bcrypt.compare(plain, stored);
}

(async () => {
  try {
    await query('ALTER TABLE gift_items ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0');
  } catch { /* column may already exist */ }
})();

async function getTenantIdFromRequest(req: Request): Promise<string | null> {
  const slug = resolveTenantSlug(req);
  const t = await queryOne<{ id: string }>('SELECT id FROM tenants WHERE slug = $1', [slug]);
  return t?.id || null;
}

function fetchUrl(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(
      url,
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 10000,
      },
      (r) => {
        if (r.statusCode && r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
          return fetchUrl(r.headers.location).then(resolve).catch(reject);
        }
        if (r.statusCode !== 200) return reject(new Error(`HTTP ${r.statusCode}`));
        const chunks: Buffer[] = [];
        r.on('data', (c: Buffer) => chunks.push(c));
        r.on('end', () => resolve(Buffer.concat(chunks)));
        r.on('error', reject);
      }
    ).on('error', reject);
  });
}

async function saveImageToDb(
  buffer: Buffer,
  mimeType: string,
  tenantId: string,
  suggestedName?: string
): Promise<string> {
  const ext = mimeType.includes('png') ? '.png' : mimeType.includes('webp') ? '.webp' : '.jpg';
  const filename = suggestedName || `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
  const urlPath = `/db-images/${filename}`;

  await pool.query(
    `INSERT INTO uploaded_images (path, mime_type, data, tenant_id) VALUES ($1, $2, $3, $4)
     ON CONFLICT (path) DO UPDATE SET data = $3, mime_type = $2, tenant_id = $4`,
    [urlPath, mimeType, buffer, tenantId]
  );
  return urlPath;
}

const memStorage = multer.memoryStorage();
const upload = multer({
  storage: memStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
});

// ─── Health ─────────────────────────────────────────────

api.get('/health', async (_req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: true });
  } catch {
    res.status(503).json({ ok: false, db: false });
  }
});

// ─── Gifts ──────────────────────────────────────────────

api.get('/gifts', async (req: Request, res: Response) => {
  const tenantId = await getTenantIdFromRequest(req);
  if (!tenantId) return res.json([]);

  const gifts = await query(
    'SELECT * FROM gift_items WHERE tenant_id = $1 ORDER BY sort_order ASC, created_at ASC',
    [tenantId]
  );
  res.json(gifts);
});

api.get('/gifts/:id', async (req: Request, res: Response) => {
  const tenantId = await getTenantIdFromRequest(req);
  if (!tenantId) return res.status(404).json({ error: 'Not found' });
  const gift = await queryOne('SELECT * FROM gift_items WHERE id = $1 AND tenant_id = $2', [
    req.params.id,
    tenantId,
  ]);
  if (!gift) return res.status(404).json({ error: 'Not found' });
  res.json(gift);
});

api.patch('/gifts/:id', requirePlatformAuth, requireTenantAccess, requireTenantEditor, async (req: Request, res: Response) => {
  const updates = req.body;
  if ('store_link' in updates) {
    const link = validateHttpsUrl(updates.store_link, { allowEmpty: true });
    if (link.ok === false) return res.status(400).json({ error: link.error });
    updates.store_link = link.value;
  }
  const allowed = ['name', 'description', 'price', 'room', 'color', 'store_name', 'store_link', 'status', 'is_featured', 'image_url', 'sort_order'];
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  for (const key of allowed) {
    if (key in updates) {
      sets.push(`${key} = $${i}`);
      values.push(updates[key]);
      i++;
    }
  }

  if (sets.length === 0) return res.status(400).json({ error: 'No valid fields' });

  sets.push('updated_at = NOW()');
  values.push(req.params.id);
  values.push(req.tenantAccess!.tenantId);

  const updated = await query(
    `UPDATE gift_items SET ${sets.join(', ')} WHERE id = $${i} AND tenant_id = $${i + 1} RETURNING id`,
    values
  );
  if (updated.length === 0) return res.status(404).json({ error: 'Presente não encontrado' });
  res.json({ ok: true });
});

// Planning tasks
api.get('/tasks', requirePlatformAuth, requireTenantAccess, async (req: Request, res: Response) => {
  const tasks = await query(
    `SELECT id, organization_id, tenant_id, title, description, status, priority,
            due_date, visibility, assigned_to_user_id, completed_at, version,
            created_at, updated_at
       FROM event_tasks WHERE tenant_id = $1
      ORDER BY (status = 'done') ASC, due_date ASC NULLS LAST, created_at DESC`,
    [req.tenantAccess!.tenantId]
  );
  res.json(tasks);
});

api.post('/tasks', requirePlatformAuth, requireTenantAccess, requireTenantEditor, async (req: Request, res: Response) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (!title || title.length > 240) {
    return res.status(400).json({ error: 'Título é obrigatório (máx. 240 caracteres)' });
  }
  const priority = ['low', 'medium', 'high', 'urgent'].includes(req.body?.priority)
    ? req.body.priority
    : 'medium';
  const visibility = req.body?.visibility === 'client' ? 'client' : 'internal';
  const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(req.body?.due_date || '') ? req.body.due_date : null;
  const description = typeof req.body?.description === 'string'
    ? req.body.description.trim().slice(0, 5000) || null
    : null;

  const task = await queryOne<Record<string, unknown> & { id: string }>(
    `INSERT INTO event_tasks
       (organization_id, tenant_id, title, description, priority, due_date, visibility, created_by_user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      req.tenantAccess!.organizationId,
      req.tenantAccess!.tenantId,
      title,
      description,
      priority,
      dueDate,
      visibility,
      req.platformAuth!.userId,
    ]
  );
  await writeAuditLog({
    organizationId: req.tenantAccess!.organizationId,
    tenantId: req.tenantAccess!.tenantId,
    actorUserId: req.platformAuth!.userId,
    action: 'task.created',
    targetType: 'event_task',
    targetId: task!.id,
    metadata: { priority, due_date: dueDate, visibility },
  });
  res.status(201).json(task);
});

api.patch('/tasks/:id', requirePlatformAuth, requireTenantAccess, requireTenantEditor, async (req: Request, res: Response) => {
  const version = Number(req.body?.version);
  if (!Number.isInteger(version) || version < 1) {
    return res.status(400).json({ error: 'Versão atual da tarefa é obrigatória' });
  }
  const allowed: Record<string, (value: unknown) => unknown> = {
    title: (value) => typeof value === 'string' ? value.trim().slice(0, 240) : undefined,
    description: (value) => typeof value === 'string' ? value.trim().slice(0, 5000) || null : null,
    status: (value) => ['todo', 'in_progress', 'blocked', 'done', 'cancelled'].includes(String(value)) ? value : undefined,
    priority: (value) => ['low', 'medium', 'high', 'urgent'].includes(String(value)) ? value : undefined,
    due_date: (value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? value : undefined,
    visibility: (value) => ['internal', 'client'].includes(String(value)) ? value : undefined,
  };
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [field, normalize] of Object.entries(allowed)) {
    if (!(field in req.body)) continue;
    const value = normalize(req.body[field]);
    if (value === undefined || (field === 'title' && !value)) {
      return res.status(400).json({ error: `Valor inválido para ${field}` });
    }
    values.push(value);
    sets.push(`${field} = $${values.length}`);
  }
  if (sets.length === 0) return res.status(400).json({ error: 'Nenhuma alteração válida' });

  const nextStatus = req.body.status;
  if (nextStatus === 'done') sets.push('completed_at = COALESCE(completed_at, NOW())');
  if (nextStatus && nextStatus !== 'done') sets.push('completed_at = NULL');
  sets.push('version = version + 1', 'updated_at = NOW()');
  values.push(req.params.id, req.tenantAccess!.tenantId, version);
  const updated = await queryOne<Record<string, unknown> & { id: string }>(
    `UPDATE event_tasks SET ${sets.join(', ')}
      WHERE id = $${values.length - 2} AND tenant_id = $${values.length - 1}
        AND version = $${values.length}
      RETURNING *`,
    values
  );
  if (!updated) {
    return res.status(409).json({
      error: 'Esta tarefa foi alterada por outra pessoa. Atualize a página e tente novamente.',
      code: 'VERSION_CONFLICT',
    });
  }
  await writeAuditLog({
    organizationId: req.tenantAccess!.organizationId,
    tenantId: req.tenantAccess!.tenantId,
    actorUserId: req.platformAuth!.userId,
    action: 'task.updated',
    targetType: 'event_task',
    targetId: updated.id,
    metadata: { fields: Object.keys(req.body).filter((key) => key !== 'version') },
  });
  res.json(updated);
});

api.delete('/tasks/:id', requirePlatformAuth, requireTenantAccess, requireTenantEditor, async (req: Request, res: Response) => {
  const deleted = await queryOne<{ id: string }>(
    'DELETE FROM event_tasks WHERE id = $1 AND tenant_id = $2 RETURNING id',
    [req.params.id, req.tenantAccess!.tenantId]
  );
  if (!deleted) return res.status(404).json({ error: 'Tarefa não encontrada' });
  await writeAuditLog({
    organizationId: req.tenantAccess!.organizationId,
    tenantId: req.tenantAccess!.tenantId,
    actorUserId: req.platformAuth!.userId,
    action: 'task.deleted',
    targetType: 'event_task',
    targetId: deleted.id,
  });
  res.json({ ok: true });
});

function detectImageMime(buffer: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return 'image/png';
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

api.post('/gifts', requirePlatformAuth, requireTenantAccess, requireTenantEditor, async (req: Request, res: Response) => {
  const tenantId = req.tenantAccess!.tenantId;

  const g = req.body;
  const storeLink = validateHttpsUrl(g.store_link, { allowEmpty: true });
  if (storeLink.ok === false) return res.status(400).json({ error: storeLink.error });
  const maxOrder = await queryOne<{ max: number }>(
    'SELECT COALESCE(MAX(sort_order), 0) as max FROM gift_items WHERE tenant_id = $1',
    [tenantId]
  );
  const nextOrder = (maxOrder?.max || 0) + 1;
  const gift = await queryOne(
    `INSERT INTO gift_items (tenant_id, name, description, price, room, color, store_name, store_link, status, is_featured, image_url, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [tenantId, g.name, g.description, g.price, g.room, g.color, g.store_name, storeLink.value, g.status || 'disponivel', g.is_featured || false, g.image_url, nextOrder]
  );
  res.json(gift);
});

api.post('/gifts/reorder', requirePlatformAuth, requireTenantAccess, requireTenantEditor, async (req: Request, res: Response) => {
  const { orderedIds } = req.body as { orderedIds: string[] };
  if (!Array.isArray(orderedIds)) return res.status(400).json({ error: 'orderedIds required' });

  for (let i = 0; i < orderedIds.length; i++) {
    await query(
      'UPDATE gift_items SET sort_order = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3',
      [i, orderedIds[i], req.tenantAccess!.tenantId]
    );
  }
  res.json({ ok: true });
});

api.delete('/gifts/:id', requirePlatformAuth, requireTenantAccess, requireTenantEditor, async (req: Request, res: Response) => {
  const deleted = await query('DELETE FROM gift_items WHERE id = $1 AND tenant_id = $2 RETURNING id', [
    req.params.id,
    req.tenantAccess!.tenantId,
  ]);
  if (deleted.length === 0) return res.status(404).json({ error: 'Presente não encontrado' });
  res.json({ ok: true });
});

// ─── Reservations ───────────────────────────────────────

api.get('/reservations', requirePlatformAuth, requireTenantAccess, async (req: Request, res: Response) => {
  const tenantId = req.tenantAccess!.tenantId;
  const reservations = await query(
    `SELECT r.id, r.gift_item_id, r.tenant_id, r.guest_name, r.guest_email,
            r.status, r.expires_at, r.created_at, r.updated_at, g.name AS gift_name
       FROM gift_reservations r
       LEFT JOIN gift_items g ON g.id = r.gift_item_id AND g.tenant_id = r.tenant_id
      WHERE r.tenant_id = $1 ORDER BY r.created_at DESC`,
    [tenantId]
  );
  res.json(reservations);
});

api.post('/reservations', publicWriteLimiter, async (req: Request, res: Response) => {
  const { gift_id, guest_name, guest_email } = req.body;
  const tenantId = await getTenantIdFromRequest(req);
  if (!tenantId) return res.status(404).json({ error: 'Evento não encontrado' });

  const nameResult = validateGuestName(guest_name);
  if (nameResult.ok === false) return res.status(400).json({ error: nameResult.error });

  const emailResult = validateGuestEmail(guest_email);
  if (emailResult.ok === false) return res.status(400).json({ error: emailResult.error });

  if (!gift_id) return res.status(400).json({ error: 'gift_id é obrigatório' });

  const result = await createReservationTransaction({
    giftId: gift_id,
    tenantId,
    guestName: nameResult.value,
    guestEmail: emailResult.value,
  });

  if (result.ok === false) {
    return res.status(result.status).json({ error: result.error });
  }

  res.json(result.reservation);
});

api.post('/reservations/:reservationId/confirm', publicWriteLimiter, async (req: Request, res: Response) => {
  const tenantId = await getTenantIdFromRequest(req);
  if (!tenantId) return res.status(404).json({ error: 'Evento não encontrado' });
  const token = typeof req.body?.token === 'string' ? req.body.token : '';
  if (!token || token.length > 200) return res.status(400).json({ error: 'Token de confirmação obrigatório' });

  const result = await confirmReservationTransaction({
    reservationId: Array.isArray(req.params.reservationId)
      ? req.params.reservationId[0]
      : req.params.reservationId,
    tenantId,
    token,
  });
  if (result.ok === false) return res.status(result.status).json({ error: result.error });
  res.json({ ok: true });
});

// ─── Messages ───────────────────────────────────────────

api.get('/messages', async (req: Request, res: Response) => {
  const tenantId = await getTenantIdFromRequest(req);
  if (!tenantId) return res.json([]);
  const messages = await query(
    'SELECT * FROM guest_messages WHERE tenant_id = $1 AND is_approved = true ORDER BY created_at DESC',
    [tenantId]
  );
  res.json(messages);
});

api.get('/admin/messages', requirePlatformAuth, requireTenantAccess, async (req: Request, res: Response) => {
  const messages = await query(
    'SELECT * FROM guest_messages WHERE tenant_id = $1 ORDER BY created_at DESC',
    [req.tenantAccess!.tenantId]
  );
  res.json(messages);
});

api.post('/messages', publicWriteLimiter, async (req: Request, res: Response) => {
  const tenantId = await getTenantIdFromRequest(req);
  if (!tenantId) return res.status(500).json({ error: 'No tenant' });

  const { guest_name, message } = req.body;
  const nameResult = validateGuestName(guest_name);
  if (nameResult.ok === false) return res.status(400).json({ error: nameResult.error });
  const msgResult = validateMessage(message);
  if (msgResult.ok === false) return res.status(400).json({ error: msgResult.error });

  const msg = await queryOne(
    'INSERT INTO guest_messages (tenant_id, guest_name, message) VALUES ($1, $2, $3) RETURNING *',
    [tenantId, nameResult.value, msgResult.value]
  );
  res.json(msg);
});

api.delete('/messages/:id', requirePlatformAuth, requireTenantAccess, requireTenantEditor, async (req: Request, res: Response) => {
  const deleted = await query('DELETE FROM guest_messages WHERE id = $1 AND tenant_id = $2 RETURNING id', [
    req.params.id,
    req.tenantAccess!.tenantId,
  ]);
  if (deleted.length === 0) return res.status(404).json({ error: 'Recado não encontrado' });
  res.json({ ok: true });
});

api.patch('/messages/:id/toggle', requirePlatformAuth, requireTenantAccess, requireTenantEditor, async (req: Request, res: Response) => {
  const updated = await query(
    'UPDATE guest_messages SET is_approved = NOT is_approved WHERE id = $1 AND tenant_id = $2 RETURNING id',
    [req.params.id, req.tenantAccess!.tenantId]
  );
  if (updated.length === 0) return res.status(404).json({ error: 'Recado não encontrado' });
  res.json({ ok: true });
});

// ─── RSVP ───────────────────────────────────────────────

api.get('/rsvp', requirePlatformAuth, requireTenantAccess, async (req: Request, res: Response) => {
  const tenantId = req.tenantAccess!.tenantId;
  const entries = await query(
    'SELECT * FROM rsvp_entries WHERE tenant_id = $1 ORDER BY created_at DESC',
    [tenantId]
  );
  res.json(entries);
});

api.post('/rsvp', publicWriteLimiter, async (req: Request, res: Response) => {
  const tenantId = await getTenantIdFromRequest(req);
  if (!tenantId) return res.status(500).json({ error: 'No tenant' });

  const { guest_name, guest_email, guests_count, dietary_restrictions, message, status } = req.body;
  const nameResult = validateGuestName(guest_name);
  if (nameResult.ok === false) return res.status(400).json({ error: nameResult.error });
  const emailResult = validateGuestEmail(guest_email);
  if (emailResult.ok === false) return res.status(400).json({ error: emailResult.error });
  if (!emailResult.value) return res.status(400).json({ error: 'E-mail é obrigatório para confirmação' });
  const countResult = validateGuestsCount(guests_count);
  if (countResult.ok === false) return res.status(400).json({ error: countResult.error });

  const dietary = trimString(dietary_restrictions, 500);
  const rsvpMessage = message ? trimString(message, 1000) : null;
  const rsvpStatus = status === 'recusado' ? 'recusado' : 'confirmado';

  const entry = await queryOne(
    `INSERT INTO rsvp_entries (tenant_id, guest_name, guest_email, guests_count, dietary_restrictions, message, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [tenantId, nameResult.value, emailResult.value, countResult.value, dietary, rsvpMessage, rsvpStatus]
  );
  res.json(entry);
});

api.delete('/rsvp/:id', requirePlatformAuth, requireTenantAccess, requireTenantEditor, async (req: Request, res: Response) => {
  const deleted = await query('DELETE FROM rsvp_entries WHERE id = $1 AND tenant_id = $2 RETURNING id', [
    req.params.id,
    req.tenantAccess!.tenantId,
  ]);
  if (deleted.length === 0) return res.status(404).json({ error: 'Confirmação não encontrada' });
  res.json({ ok: true });
});

// ─── Tenants (public) ───────────────────────────────────

api.get('/tenants/:slug/public', async (req: Request, res: Response) => {
  const slugParam = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const slug = normalizeSlug(slugParam);
  if (!isValidSlug(slug)) return res.status(400).json({ error: 'Slug inválido' });

  const tenant = await queryOne<{
    id: string;
    slug: string;
    name: string;
    event_date: string | null;
    theme_config: Record<string, unknown>;
  }>('SELECT id, slug, name, event_date, theme_config FROM tenants WHERE slug = $1', [slug]);

  if (!tenant) return res.status(404).json({ error: 'Site não encontrado' });

  res.json({
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    event_date: tenant.event_date,
    config: tenant.theme_config || {},
  });
});

// ─── Site Config ────────────────────────────────────────

api.get('/site-config', async (req: Request, res: Response) => {
  const slug = resolveTenantSlug(req);
  const tenant = await queryOne<{ theme_config: Record<string, unknown> }>(
    'SELECT theme_config FROM tenants WHERE slug = $1',
    [slug]
  );
  res.json(tenant?.theme_config || {});
});

api.patch('/site-config', requirePlatformAuth, requireTenantAccess, requireTenantEditor, async (req: Request, res: Response) => {
  const tenant = await queryOne<{ theme_config: Record<string, unknown> }>(
    'SELECT theme_config FROM tenants WHERE id = $1',
    [req.tenantAccess!.tenantId]
  );
  const current = tenant?.theme_config || {};
  const merged = { ...current, ...req.body };

  await query('UPDATE tenants SET theme_config = $1, updated_at = NOW() WHERE id = $2', [
    JSON.stringify(merged),
    req.tenantAccess!.tenantId,
  ]);
  res.json({ ok: true });
});

// ─── Auth ───────────────────────────────────────────────

api.post('/auth/login', legacyAdminDisabled, async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
  }

  const user = await queryOne<{ id: string; username: string; name: string; password: string }>(
    'SELECT id, username, name, password FROM admin_users WHERE username = $1',
    [email]
  );

  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = signToken({ userId: user.id, username: user.username });
  return res.json({
    ok: true,
    token,
    user: { id: user.id, username: user.username, name: user.name },
  });
});

api.get('/auth/me', legacyAdminDisabled, requireAuth, async (req: Request, res: Response) => {
  const user = await queryOne<{ id: string; username: string; name: string }>(
    'SELECT id, username, name FROM admin_users WHERE id = $1',
    [req.auth!.userId]
  );
  if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
  res.json({ user });
});

// ─── Admin Users ───────────────────────────────────────

api.get('/admin-users', legacyAdminDisabled, requireAuth, async (_req: Request, res: Response) => {
  const users = await query(
    'SELECT id, username, name, created_at FROM admin_users ORDER BY created_at ASC'
  );
  res.json(users);
});

api.post('/admin-users', legacyAdminDisabled, requireAuth, async (req: Request, res: Response) => {
  const { username, password, name } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  try {
    const hashed = await hashPassword(password);
    const user = await queryOne(
      'INSERT INTO admin_users (username, password, name) VALUES ($1, $2, $3) RETURNING id, username, name, created_at',
      [username, hashed, name || username]
    );
    res.json(user);
  } catch (e: unknown) {
    if ((e as { code?: string }).code === '23505') return res.status(400).json({ error: 'Username already exists' });
    res.status(500).json({ error: 'Failed to create user' });
  }
});

api.patch('/admin-users/:id', legacyAdminDisabled, requireAuth, async (req: Request, res: Response) => {
  const { username, password, name } = req.body;
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (username) {
    sets.push(`username = $${i++}`);
    values.push(username);
  }
  if (password) {
    sets.push(`password = $${i++}`);
    values.push(await hashPassword(password));
  }
  if (name !== undefined) {
    sets.push(`name = $${i++}`);
    values.push(name);
  }
  if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.params.id);
  try {
    await query(`UPDATE admin_users SET ${sets.join(', ')} WHERE id = $${i}`, values);
    res.json({ ok: true });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === '23505') return res.status(400).json({ error: 'Username already exists' });
    res.status(500).json({ error: 'Failed to update user' });
  }
});

api.delete('/admin-users/:id', legacyAdminDisabled, requireAuth, async (req: Request, res: Response) => {
  const count = await query<{ cnt: string }>('SELECT count(*)::text as cnt FROM admin_users');
  if (parseInt(count[0]?.cnt || '0') <= 1) {
    return res.status(400).json({ error: 'Cannot delete the last admin user' });
  }
  await query('DELETE FROM admin_users WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// ─── Image Upload ───────────────────────────────────────

api.post('/upload', requirePlatformAuth, requireTenantAccess, requireTenantEditor, upload.single('image'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const detectedMime = detectImageMime(req.file.buffer);
  if (!detectedMime) return res.status(400).json({ error: 'Arquivo de imagem inválido' });
  try {
    const url = await saveImageToDb(req.file.buffer, detectedMime, req.tenantAccess!.tenantId);
    res.json({ url });
  } catch {
    res.status(500).json({ error: 'Upload failed' });
  }
});

api.post('/gifts/:id/regenerate-image', requirePlatformAuth, requireTenantAccess, requireTenantEditor, imageRegenerationDisabled, async (req: Request, res: Response) => {
  const gift = await queryOne<{ id: string; name: string }>(
    'SELECT id, name FROM gift_items WHERE id = $1 AND tenant_id = $2',
    [req.params.id, req.tenantAccess!.tenantId]
  );
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

        const detectedMime = detectImageMime(buffer);
        if (!detectedMime) continue;
        const newUrl = await saveImageToDb(buffer, detectedMime, req.tenantAccess!.tenantId);
        await query(
          'UPDATE gift_items SET image_url = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3',
          [newUrl, gift.id, req.tenantAccess!.tenantId]
        );
        return res.json({ ok: true, image_url: newUrl });
      } catch {
        continue;
      }
    }

    res.status(404).json({ error: 'Could not download any image' });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to regenerate image';
    res.status(500).json({ error: message });
  }
});
