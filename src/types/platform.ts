export type PlanId = 'free' | 'solo' | 'pro' | 'studio' | 'founders';
export type SiteStatus = 'draft' | 'published' | 'suspended' | 'archived';

export type Entitlements = Record<string, boolean | number | string>;

export interface PlanSummary {
  code: PlanId;
  name: string;
  description: string;
  monthly_price_cents: number;
  annual_price_cents: number;
  entitlements: Entitlements;
}

export interface PlatformAccount {
  organization: { id: string; name: string };
  role: 'owner' | 'admin' | 'planner' | 'coordinator' | 'viewer';
  plan: { code: PlanId; name: string };
  entitlements: Entitlements;
  usage: { active_events: number; team_seats: number };
  pending_request: {
    requested_plan_code: PlanId;
    status: 'pending' | 'contacted';
    created_at: string;
  } | null;
}

export interface PlatformUser {
  id: string;
  email: string;
  name: string | null;
}

export interface SiteSummary {
  id: string;
  slug: string;
  couple_name: string;
  event_date: string | null;
  plan: PlanId;
  status: SiteStatus;
  gift_count: number;
  created_at: string;
}

export interface TenantPublic {
  id: string;
  slug: string;
  name: string;
  event_date: string | null;
  config: import('./index').SiteConfig;
}
