import { beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(() => {
  vi.stubEnv('JWT_SECRET', 'test-secret-with-at-least-32-characters');
});

describe('authentication boundaries', () => {
  it('does not accept a platform token as a legacy admin token', async () => {
    const platform = await import('../middleware/platformAuth.js');
    const legacy = await import('../middleware/auth.js');
    const token = platform.signPlatformToken({ userId: 'user-1', email: 'owner@example.com' });

    expect(platform.verifyPlatformToken(token)?.type).toBe('platform');
    expect(legacy.verifyToken(token)).toBeNull();
  });

  it('does not accept a legacy admin token as a platform token', async () => {
    const platform = await import('../middleware/platformAuth.js');
    const legacy = await import('../middleware/auth.js');
    const token = legacy.signToken({ userId: 'legacy-1', username: 'admin' });

    expect(legacy.verifyToken(token)?.type).toBe('legacy-admin');
    expect(platform.verifyPlatformToken(token)).toBeNull();
  });
});
