'use client';

import { User } from '@/lib/auth/types';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getMe, getToken } from '@/lib/api-client/actions';

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const [result, tokenResult] = await Promise.all([getMe(), getToken()]);
    setUser(result);
    setToken(tokenResult);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        setLoading(true);
        const [result, tokenResult] = await Promise.all([getMe(), getToken()]);
        if (!cancelled) {
          setUser(result);
          setToken(tokenResult);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
