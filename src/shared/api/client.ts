import { getApiTenantSlug } from './tenant-slug';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const AUTH_TOKEN_KEY = 'parasempre_platform_token';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
  else localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function request<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const tenantSlug = getApiTenantSlug();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (tenantSlug) headers['X-Tenant-Slug'] = tenantSlug;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const message = (err as { error?: string }).error || 'Request failed';
    throw new ApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T = unknown>(path: string) => request<T>(path),
  post: <T = unknown>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T = unknown>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path: string) => request(path, { method: 'DELETE' }),
  upload: async (path: string, file: File): Promise<{ url: string }> => {
    const token = getAuthToken();
    const tenantSlug = getApiTenantSlug();
    const formData = new FormData();
    formData.append('image', file);
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (tenantSlug) headers['X-Tenant-Slug'] = tenantSlug;
    const res = await fetch(`${API_BASE}${path}`, { method: 'POST', body: formData, headers });
    if (!res.ok) throw new ApiError('Upload failed', res.status);
    return res.json();
  },
};

/** Re-export for backward compatibility during migration. */
export { api as default };
