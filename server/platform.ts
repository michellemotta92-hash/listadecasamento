import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { pool, query, queryOne } from './db.js';
import { isValidSlug, normalizeSlug } from './tenant.js';
import { requirePlatformAuth, signPlatformToken } from './middleware/platformAuth.js';
import { publicWriteLimiter } from './middleware/rateLimit.js';
import { getOrganizationPlan, numericEntitlement } from './entitlements.js';

const BCRYPT_ROUNDS = 10;

export const platformApi = Router();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (!stored.startsWith('$2')) return false;
  return bcrypt.compare(plain, stored);
}

platformApi.get('/plans', async (_req: Request, res: Response) => {
  const plans = await query(
    `SELECT code, name, description, monthly_price_cents, annual_price_cents, entitlements
       FROM plan_catalog WHERE is_public = true ORDER BY sort_order ASC`
  );
  res.json(plans);
});

platformApi.post('/register', publicWriteLimiter, async (req: Request, res: Response) => {
  const { email, password, name } = req.body as { email?: string; password?: string; name?: string };
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail || !password || password.length < 8) {
    return res.status(400).json({ error: 'E-mail e senha (mín. 8 caracteres) são obrigatórios' });
  }

  const client = await pool.connect();
  let user: { id: string; email: string; name: string | null } | undefined;
  try {
    await client.query('BEGIN');
    const hashed = await hashPassword(password);
    const userResult = await client.query<{ id: string; email: string; name: string | null }>(
      `INSERT INTO platform_users (email, password, name) VALUES ($1, $2, $3)
       RETURNING id, email, name`,
      [normalizedEmail, hashed, name?.trim() || null]
    );
    user = userResult.rows[0];
    if (!user) throw new Error('User was not created');

    const organizationResult = await client.query<{ id: string }>(
      `INSERT INTO organizations (name, slug, created_by_user_id)
       VALUES ($1, $2, $3) RETURNING id`,
      [name?.trim() || 'Minha assessoria', `org-${user.id.replaceAll('-', '').slice(0, 20)}`, user.id]
    );
    await client.query(
      `INSERT INTO organization_memberships (organization_id, user_id, role, status)
       VALUES ($1, $2, 'owner', 'active')`,
      [organizationResult.rows[0].id, user.id]
    );
    await client.query('COMMIT');
  } catch (error: unknown) {
    await client.query('ROLLBACK');
    if ((error as { code?: string }).code === '23505') {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado' });
    }
    throw error;
  } finally {
    client.release();
  }

  const token = signPlatformToken({ userId: user.id, email: user.email });
  res.status(201).json({
    ok: true,
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

platformApi.post('/login', publicWriteLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
  }

  const user = await queryOne<{ id: string; email: string; name: string | null; password: string }>(
    'SELECT id, email, name, password FROM platform_users WHERE email = $1',
    [normalizedEmail]
  );
  if (!user || !(await verifyPassword(password, user.password))) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = signPlatformToken({ userId: user.id, email: user.email });
  res.json({ ok: true, token, user: { id: user.id, email: user.email, name: user.name } });
});

platformApi.get('/me', requirePlatformAuth, async (req: Request, res: Response) => {
  const user = await queryOne<{ id: string; email: string; name: string | null }>(
    'SELECT id, email, name FROM platform_users WHERE id = $1',
    [req.platformAuth!.userId]
  );
  if (!user) return res.status(401).json({ error: 'Usuário não encontrado' });
  res.json({ user });
});

platformApi.get('/account', requirePlatformAuth, async (req: Request, res: Response) => {
  const account = await queryOne<{
    organization_id: string;
    organization_name: string;
    role: string;
    plan_code: string;
    plan_name: string;
    entitlements: Record<string, boolean | number | string>;
    event_count: string;
    team_count: string;
  }>(
    `SELECT o.id AS organization_id, o.name AS organization_name, m.role,
            p.code AS plan_code, p.name AS plan_name, p.entitlements,
            (SELECT COUNT(*)::text FROM tenants t
              WHERE t.organization_id = o.id AND t.status NOT IN ('archived', 'suspended')) AS event_count,
            (SELECT COUNT(*)::text FROM organization_memberships om
              WHERE om.organization_id = o.id AND om.status = 'active') AS team_count
       FROM organization_memberships m
       JOIN organizations o ON o.id = m.organization_id AND o.status = 'active'
       JOIN plan_catalog p ON p.code = o.plan_code
      WHERE m.user_id = $1 AND m.status = 'active'
      ORDER BY m.created_at ASC LIMIT 1`,
    [req.platformAuth!.userId]
  );
  if (!account) return res.status(404).json({ error: 'Organização não encontrada' });

  const pendingRequest = await queryOne<{ requested_plan_code: string; status: string; created_at: string }>(
    `SELECT requested_plan_code, status, created_at
       FROM plan_upgrade_requests
      WHERE organization_id = $1 AND status IN ('pending', 'contacted')
      ORDER BY created_at DESC LIMIT 1`,
    [account.organization_id]
  );

  res.json({
    organization: { id: account.organization_id, name: account.organization_name },
    role: account.role,
    plan: { code: account.plan_code, name: account.plan_name },
    entitlements: account.entitlements,
    usage: {
      active_events: Number.parseInt(account.event_count, 10) || 0,
      team_seats: Number.parseInt(account.team_count, 10) || 0,
    },
    pending_request: pendingRequest,
  });
});

platformApi.post('/upgrade-requests', requirePlatformAuth, async (req: Request, res: Response) => {
  const { plan_code, billing_cycle } = req.body as { plan_code?: string; billing_cycle?: string };
  if (!plan_code || !['monthly', 'annual'].includes(billing_cycle || 'monthly')) {
    return res.status(400).json({ error: 'Plano ou ciclo inválido' });
  }

  const membership = await queryOne<{ organization_id: string }>(
    `SELECT m.organization_id
       FROM organization_memberships m
       JOIN organizations o ON o.id = m.organization_id AND o.status = 'active'
      WHERE m.user_id = $1 AND m.status = 'active' AND m.role IN ('owner', 'admin')
      ORDER BY m.created_at ASC LIMIT 1`,
    [req.platformAuth!.userId]
  );
  if (!membership) return res.status(403).json({ error: 'Somente owner ou admin pode contratar planos' });

  const plan = await queryOne<{ code: string }>(
    'SELECT code FROM plan_catalog WHERE code = $1 AND is_public = true AND code <> $2',
    [plan_code, 'free']
  );
  if (!plan) return res.status(404).json({ error: 'Plano não encontrado' });

  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM plan_upgrade_requests
      WHERE organization_id = $1 AND requested_plan_code = $2
        AND status IN ('pending', 'contacted')`,
    [membership.organization_id, plan.code]
  );
  if (existing) return res.status(200).json({ ok: true, request_id: existing.id, already_pending: true });

  const request = await queryOne<{ id: string }>(
    `INSERT INTO plan_upgrade_requests
       (organization_id, requested_by_user_id, requested_plan_code, billing_cycle)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [membership.organization_id, req.platformAuth!.userId, plan.code, billing_cycle || 'monthly']
  );
  res.status(201).json({ ok: true, request_id: request!.id });
});

platformApi.get('/sites', requirePlatformAuth, async (req: Request, res: Response) => {
  const sites = await query<{
    id: string;
    slug: string;
    name: string;
    event_date: string | null;
    created_at: string;
    gift_count: string;
    status: 'draft' | 'published' | 'suspended' | 'archived';
    plan_code: string;
  }>(
    `SELECT DISTINCT t.id, t.slug, t.name, t.event_date, t.created_at, t.status,
            o.plan_code,
            (SELECT COUNT(*)::text FROM gift_items g WHERE g.tenant_id = t.id) AS gift_count
       FROM tenants t
       JOIN organizations o ON o.id = t.organization_id AND o.status = 'active'
       JOIN organization_memberships m ON m.organization_id = t.organization_id
      WHERE m.user_id = $1 AND m.status = 'active'
      ORDER BY t.created_at DESC`,
    [req.platformAuth!.userId]
  );
  res.json(
    sites.map((site) => ({
      id: site.id,
      slug: site.slug,
      couple_name: site.name,
      event_date: site.event_date,
      created_at: site.created_at,
      gift_count: Number.parseInt(site.gift_count, 10) || 0,
      status: site.status,
      plan: site.plan_code,
    }))
  );
});

platformApi.post('/sites', requirePlatformAuth, async (req: Request, res: Response) => {
  const { slug, couple_name, event_date } = req.body as {
    slug?: string;
    couple_name?: string;
    event_date?: string;
  };
  const normalized = normalizeSlug(slug || '');
  if (!isValidSlug(normalized)) {
    return res.status(400).json({
      error: 'Slug inválido. Use apenas letras minúsculas, números e hífens (2–64 caracteres).',
    });
  }

  const name = couple_name?.trim();
  if (!name || name.length > 120) {
    return res.status(400).json({ error: 'Nome do casal é obrigatório (máx. 120 caracteres).' });
  }

  const organization = await queryOne<{ id: string; plan_code: string }>(
    `SELECT m.organization_id AS id, o.plan_code
       FROM organization_memberships m
       JOIN organizations o ON o.id = m.organization_id AND o.status = 'active'
      WHERE m.user_id = $1 AND m.status = 'active'
        AND m.role IN ('owner', 'admin', 'planner')
      ORDER BY m.created_at ASC LIMIT 1`,
    [req.platformAuth!.userId]
  );
  if (!organization) {
    return res.status(403).json({ error: 'Sua conta não pode criar eventos.' });
  }

  const organizationPlan = await getOrganizationPlan(organization.id);
  if (!organizationPlan) return res.status(403).json({ error: 'Plano da organização indisponível' });
  const activeEventsLimit = numericEntitlement(organizationPlan.entitlements, 'active_events.max');
  const activeEvents = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM tenants
      WHERE organization_id = $1 AND status NOT IN ('archived', 'suspended')`,
    [organization.id]
  );
  const activeEventsUsage = Number.parseInt(activeEvents?.count || '0', 10);
  if (activeEventsUsage >= activeEventsLimit) {
    return res.status(409).json({
      error: `Seu plano permite ${activeEventsLimit} evento(s) ativo(s).`,
      code: 'PLAN_LIMIT_REACHED',
      entitlement: 'active_events.max',
      limit: activeEventsLimit,
      usage: activeEventsUsage,
    });
  }

  const themeConfig = {
    couple_name: name,
    event_date: event_date || undefined,
    theme: 'default',
    hidden_pages: [],
    page_texts: {},
    pix: { enabled: false, key_type: 'email', key: '' },
  };

  try {
    const tenant = await queryOne<{ id: string; slug: string; name: string; created_at: string }>(
      `INSERT INTO tenants (name, slug, event_date, theme_config, owner_id, organization_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, slug, name, created_at`,
      [
        name,
        normalized,
        event_date || null,
        JSON.stringify(themeConfig),
        req.platformAuth!.userId,
        organization.id,
      ]
    );
    if (!tenant) return res.status(500).json({ error: 'Erro ao criar site' });

    return res.status(201).json({
      id: tenant.id,
      slug: tenant.slug,
      couple_name: tenant.name,
      event_date: event_date || null,
      created_at: tenant.created_at,
      gift_count: 0,
      status: 'published',
      plan: organization.plan_code,
    });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === '23505') {
      return res.status(409).json({ error: 'Este endereço (slug) já está em uso.' });
    }
    throw error;
  }
});
