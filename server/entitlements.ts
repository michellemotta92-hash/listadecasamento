import { queryOne } from './db.js';

export type EntitlementValue = boolean | number | string;
export type Entitlements = Record<string, EntitlementValue>;

export interface OrganizationPlan {
  organizationId: string;
  planCode: string;
  planName: string;
  entitlements: Entitlements;
}

export async function getOrganizationPlan(organizationId: string): Promise<OrganizationPlan | null> {
  return queryOne<OrganizationPlan>(
    `SELECT o.id AS "organizationId", p.code AS "planCode", p.name AS "planName",
            p.entitlements
       FROM organizations o
       JOIN plan_catalog p ON p.code = o.plan_code
      WHERE o.id = $1 AND o.status = 'active'`,
    [organizationId]
  );
}

export function numericEntitlement(
  entitlements: Entitlements,
  key: string,
  fallback = 0
): number {
  const value = entitlements[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
