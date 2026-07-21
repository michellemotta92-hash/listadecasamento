import { NextFunction, Request, Response } from 'express';
import { queryOne } from '../db.js';
import { isValidSlug, resolveTenantSlug } from '../tenant.js';

export type OrganizationRole = 'owner' | 'admin' | 'planner' | 'coordinator' | 'viewer';

export interface TenantAccess {
  tenantId: string;
  organizationId: string;
  slug: string;
  role: OrganizationRole;
}

declare global {
  namespace Express {
    interface Request {
      tenantAccess?: TenantAccess;
    }
  }
}

const EDITOR_ROLES: OrganizationRole[] = ['owner', 'admin', 'planner', 'coordinator'];

export async function requireTenantAccess(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const slug = resolveTenantSlug(req);
  if (!isValidSlug(slug) || !req.platformAuth) {
    res.status(401).json({ error: 'Não autorizado' });
    return;
  }

  const access = await queryOne<TenantAccess>(
    `SELECT t.id AS "tenantId", t.organization_id AS "organizationId",
            t.slug, m.role
       FROM tenants t
       JOIN organizations o ON o.id = t.organization_id AND o.status = 'active'
       JOIN organization_memberships m
         ON m.organization_id = t.organization_id
        AND m.user_id = $2
        AND m.status = 'active'
      WHERE t.slug = $1`,
    [slug, req.platformAuth.userId]
  );

  if (!access) {
    res.status(404).json({ error: 'Evento não encontrado' });
    return;
  }

  req.tenantAccess = access;
  next();
}

export function requireTenantEditor(req: Request, res: Response, next: NextFunction): void {
  if (!req.tenantAccess || !EDITOR_ROLES.includes(req.tenantAccess.role)) {
    res.status(403).json({ error: 'Seu perfil não permite alterar este evento' });
    return;
  }
  next();
}
