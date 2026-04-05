import { appConfig } from '@/lib/config';
import { api } from '@/lib/api';

const AUTH_KEY = 'parasempre_admin_auth';

export async function signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  if (appConfig.isDemoMode) {
    if (email === 'admin' && password === 'admin123') {
      localStorage.setItem(AUTH_KEY, 'true');
      return { success: true };
    }
    return { success: false, error: 'Credenciais inválidas. Use admin / admin123 no modo demo.' };
  }

  try {
    const result = await api.post<{ ok: boolean }>('/auth/login', { email, password });
    if (result.ok) {
      localStorage.setItem(AUTH_KEY, 'true');
      return { success: true };
    }
    return { success: false, error: 'Credenciais inválidas.' };
  } catch {
    return { success: false, error: 'Credenciais inválidas.' };
  }
}

export async function signOut(): Promise<void> {
  localStorage.removeItem(AUTH_KEY);
}

export async function isAuthenticated(): Promise<boolean> {
  return localStorage.getItem(AUTH_KEY) === 'true';
}
