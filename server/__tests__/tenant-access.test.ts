import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queryOne } = vi.hoisted(() => ({ queryOne: vi.fn() }));
vi.mock('../db.js', () => ({ queryOne }));

import { requireTenantAccess, requireTenantEditor } from '../middleware/tenantAccess.js';

function responseMock() {
  const response = { status: vi.fn(), json: vi.fn() };
  response.status.mockReturnValue(response);
  return response;
}

describe('tenant access boundary', () => {
  beforeEach(() => queryOne.mockReset());

  it('attaches only the membership returned for the signed-in user', async () => {
    queryOne.mockResolvedValue({
      tenantId: 'tenant-a', organizationId: 'org-a', slug: 'casal-a', role: 'planner',
    });
    const request = {
      headers: { 'x-tenant-slug': 'casal-a' },
      platformAuth: { userId: 'user-a', email: 'a@example.com', type: 'platform' },
    } as never;
    const response = responseMock();
    const next = vi.fn();

    await requireTenantAccess(request, response as never, next);

    expect(queryOne).toHaveBeenCalledWith(expect.stringContaining('m.user_id = $2'), ['casal-a', 'user-a']);
    expect((request as { tenantAccess?: { tenantId: string } }).tenantAccess?.tenantId).toBe('tenant-a');
    expect(next).toHaveBeenCalledOnce();
  });

  it('hides an event from a user without membership', async () => {
    queryOne.mockResolvedValue(null);
    const request = {
      headers: { 'x-tenant-slug': 'casal-b' },
      platformAuth: { userId: 'user-a', email: 'a@example.com', type: 'platform' },
    } as never;
    const response = responseMock();
    const next = vi.fn();

    await requireTenantAccess(request, response as never, next);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  it('prevents a viewer from mutating a tenant', () => {
    const request = { tenantAccess: { role: 'viewer' } } as never;
    const response = responseMock();
    const next = vi.fn();

    requireTenantEditor(request, response as never, next);

    expect(response.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
