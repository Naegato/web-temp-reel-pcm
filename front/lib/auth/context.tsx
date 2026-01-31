'use client';

import { User } from '@/lib/auth/types';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getMe } from '@/lib/api-client/actions';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ user, setUser ] = useState<User | null>(null);
  const [ loading, setLoading ] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const result = await getMe();
    setUser(result);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        setLoading(true);
        console.log('Loading user...');
        const result = await getMe();
        console.log('User loaded:', result);
        if (!cancelled) {
          setUser(result);
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
    <AuthContext.Provider value={{ user, loading, refresh }}>
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
