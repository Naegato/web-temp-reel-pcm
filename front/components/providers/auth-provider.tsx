'use client';

import { AuthProvider } from '@/lib/auth/context';
import { ReactNode } from 'react';
import type { User } from '@/lib/api/client';

interface ClientAuthProviderProps {
  children: ReactNode;
  initialUser: User | null;
}

export function ClientAuthProvider({ children, initialUser }: ClientAuthProviderProps) {
  return (
    <AuthProvider initialUser={initialUser}>
      {children}
    </AuthProvider>
  );
}