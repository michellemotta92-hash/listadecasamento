import type { Request } from 'express';

export const TENANT_SLUG = (process.env.TENANT_SLUG || 'miejohn').toLowerCase();

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export function normalizeSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug) && slug.length >= 2 && slug.length <= 64;
}

/** Resolves tenant from `X-Tenant-Slug` header or env fallback. */
export function resolveTenantSlug(req: Request): string {
  const header = req.headers['x-tenant-slug'];
  if (typeof header === 'string' && header.trim()) {
    const slug = normalizeSlug(header);
    if (isValidSlug(slug)) return slug;
  }
  return TENANT_SLUG;
}
