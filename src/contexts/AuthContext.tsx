import { createContext, useContext, ReactNode } from 'react';
import { usePlatformAuth } from '@/contexts/PlatformAuthContext';

interface AuthContextType {
  isLoggedIn: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Compatibility facade for the tenant admin UI. Authentication has one source
 * of truth: the platform session. Tenant authorization is enforced by the API.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const platform = usePlatformAuth();
  const signOut = async () => platform.signOut();

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: platform.isLoggedIn,
        loading: platform.loading,
        signIn: platform.signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
