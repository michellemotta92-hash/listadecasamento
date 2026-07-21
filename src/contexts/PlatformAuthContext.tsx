import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { appConfig } from '@/lib/config';
import {
  getPlatformToken,
  getPlatformUser,
  platformApi,
  setPlatformSession,
} from '@/features/platform/api';
import { PlatformUser } from '@/types/platform';

interface PlatformAuthContextType {
  user: PlatformUser | null;
  loading: boolean;
  isLoggedIn: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
}

const PlatformAuthContext = createContext<PlatformAuthContextType | null>(null);

const DEMO_PLATFORM_KEY = 'parasempre_platform_demo';

export function PlatformAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (appConfig.isDemoMode) {
      const demo = localStorage.getItem(DEMO_PLATFORM_KEY) === 'true';
      if (demo) {
        setUser({ id: 'demo-platform', email: 'demo@parasempre.app', name: 'Demo' });
      }
      setLoading(false);
      return;
    }

    const token = getPlatformToken();
    const stored = getPlatformUser();
    if (!token || !stored) {
      setLoading(false);
      return;
    }

    platformApi
      .me()
      .then((res) => setUser(res.user))
      .catch(() => setPlatformSession(null, null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    if (appConfig.isDemoMode) {
      if (email && password.length >= 4) {
        localStorage.setItem(DEMO_PLATFORM_KEY, 'true');
        const u = { id: 'demo-platform', email, name: 'Demo' };
        setUser(u);
        return { success: true };
      }
      return { success: false, error: 'Use qualquer e-mail e senha com 4+ caracteres no modo demo.' };
    }
    try {
      const res = await platformApi.login({ email, password });
      setPlatformSession(res.token, res.user);
      setUser(res.user);
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Erro ao entrar' };
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    if (appConfig.isDemoMode) {
      localStorage.setItem(DEMO_PLATFORM_KEY, 'true');
      const u = { id: 'demo-platform', email, name: name || null };
      setUser(u);
      return { success: true };
    }
    try {
      const res = await platformApi.register({ email, password, name });
      setPlatformSession(res.token, res.user);
      setUser(res.user);
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Erro ao cadastrar' };
    }
  };

  const signOut = () => {
    if (appConfig.isDemoMode) {
      localStorage.removeItem(DEMO_PLATFORM_KEY);
    } else {
      setPlatformSession(null, null);
    }
    setUser(null);
  };

  return (
    <PlatformAuthContext.Provider
      value={{
        user,
        loading,
        isLoggedIn: Boolean(user),
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </PlatformAuthContext.Provider>
  );
}

export function usePlatformAuth() {
  const ctx = useContext(PlatformAuthContext);
  if (!ctx) throw new Error('usePlatformAuth must be used within PlatformAuthProvider');
  return ctx;
}
