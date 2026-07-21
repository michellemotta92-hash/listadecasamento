import { PlanId, PlanSummary, PlatformAccount, PlatformUser, SiteSummary } from '@/types/platform';
import { appConfig } from '@/lib/config';

const PLATFORM_TOKEN_KEY = 'parasempre_platform_token';
const PLATFORM_USER_KEY = 'parasempre_platform_user';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function getPlatformToken(): string | null {
  return localStorage.getItem(PLATFORM_TOKEN_KEY);
}

export function setPlatformSession(token: string | null, user: PlatformUser | null): void {
  if (token && user) {
    localStorage.setItem(PLATFORM_TOKEN_KEY, token);
    localStorage.setItem(PLATFORM_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(PLATFORM_TOKEN_KEY);
    localStorage.removeItem(PLATFORM_USER_KEY);
  }
}

export function getPlatformUser(): PlatformUser | null {
  const raw = localStorage.getItem(PLATFORM_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PlatformUser;
  } catch {
    return null;
  }
}

async function platformRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getPlatformToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/platform${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || 'Request failed');
  }
  return res.json() as Promise<T>;
}

export const platformApi = {
  register: (body: { email: string; password: string; name?: string }) =>
    platformRequest<{ ok: boolean; token: string; user: PlatformUser }>('/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    platformRequest<{ ok: boolean; token: string; user: PlatformUser }>('/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  me: () => platformRequest<{ user: PlatformUser }>('/me'),

  listSites: () => platformRequest<SiteSummary[]>('/sites'),

  createSite: (body: { slug: string; couple_name: string; event_date?: string }) =>
    platformRequest<SiteSummary>('/sites', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  listPlans: () => platformRequest<PlanSummary[]>('/plans'),

  account: () => platformRequest<PlatformAccount>('/account'),

  requestUpgrade: (body: { plan_code: PlanId; billing_cycle: 'monthly' | 'annual' }) =>
    platformRequest<{ ok: true; request_id: string; already_pending?: boolean }>('/upgrade-requests', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export async function listSitesWithDemo(): Promise<SiteSummary[]> {
  if (appConfig.isDemoMode) {
    const { getDemoSites } = await import('./demo-sites');
    return getDemoSites();
  }
  return platformApi.listSites();
}

export async function createSiteWithDemo(body: {
  slug: string;
  couple_name: string;
  event_date?: string;
}): Promise<SiteSummary> {
  if (appConfig.isDemoMode) {
    const { addDemoSite } = await import('./demo-sites');
    const site: SiteSummary = {
      id: `demo-${body.slug}`,
      slug: body.slug,
      couple_name: body.couple_name,
      event_date: body.event_date || null,
      plan: 'free',
      status: 'published',
      gift_count: 0,
      created_at: new Date().toISOString(),
    };
    addDemoSite(site);
    return site;
  }
  return platformApi.createSite(body);
}
