import { appConfig } from '@/lib/config';
import { api, setAuthToken, getAuthToken } from '@/lib/api';

const AUTH_KEY = 'parasempre_admin_auth';

export async function signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  if (appConfig.isDemoMode) {
    if (email === 'admin' && password === 'admin123') {
      localStorage.setItem(AUTH_KEY, 'true');
      setAuthToken('demo-token');
      return { success: true };
    }
    return { success: false, error: 'Credenciais inválidas. Use admin / admin123 no modo demo.' };
  }

  try {
    const result = await api.post<{ ok: boolean; token: string }>('/auth/login', { email, password });
    if (result.ok && result.token) {
      localStorage.setItem(AUTH_KEY, 'true');
      setAuthToken(result.token);
      return { success: true };
    }
    return { success: false, error: 'Credenciais inválidas.' };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Credenciais inválidas.' };
  }
}

export async function signOut(): Promise<void> {
  localStorage.removeItem(AUTH_KEY);
  setAuthToken(null);
}

export async function isAuthenticated(): Promise<boolean> {
  if (appConfig.isDemoMode) {
    return localStorage.getItem(AUTH_KEY) === 'true';
  }
  const token = getAuthToken();
  if (!token || localStorage.getItem(AUTH_KEY) !== 'true') return false;
  try {
    await api.get('/auth/me');
    return true;
  } catch {
    localStorage.removeItem(AUTH_KEY);
    setAuthToken(null);
    return false;
  }
}
