import { SiteSummary } from '@/types/platform';

const KEY = 'parasempre_demo_sites';

export function getDemoSites(): SiteSummary[] {
  const base: SiteSummary = {
    id: 'demo-miejohn',
    slug: 'miejohn',
    couple_name: 'Mi & John',
    event_date: '2026-10-12',
    plan: 'free',
    status: 'published',
    gift_count: 0,
    created_at: new Date().toISOString(),
  };
  try {
    const extra = JSON.parse(localStorage.getItem(KEY) || '[]') as SiteSummary[];
    return [base, ...extra];
  } catch {
    return [base];
  }
}

export function addDemoSite(site: SiteSummary): void {
  const extra = getDemoSites().filter((s) => s.slug !== 'miejohn');
  extra.push(site);
  localStorage.setItem(KEY, JSON.stringify(extra));
}

export function isDemoTenantSlug(slug: string): boolean {
  return getDemoSites().some((s) => s.slug === slug);
}
