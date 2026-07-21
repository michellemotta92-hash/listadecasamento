/** Current tenant slug for API requests (set by TenantProvider). */
let activeTenantSlug: string | null = null;

export function setApiTenantSlug(slug: string | null): void {
  activeTenantSlug = slug;
}

export function getApiTenantSlug(): string | null {
  return activeTenantSlug;
}
