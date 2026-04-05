import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isAuthenticated, signIn as authSignIn, signOut as authSignOut } from '@/lib/services/auth';

interface AuthContextType {
  isLoggedIn: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    isAuthenticated().then((auth) => {
      setIsLoggedIn(auth);
      setLoading(false);
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await authSignIn(email, password);
    if (result.success) {
      setIsLoggedIn(true);
    }
    return result;
  };

  const signOut = async () => {
    await authSignOut();
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
