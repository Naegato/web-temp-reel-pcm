'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction, logoutAction, registerAction, cleanupInvalidToken } from './actions';
import { getRedirectUrl } from './client-utils';
import type { LoginCredentials, RegisterCredentials, User } from '@/lib/api/client';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null;
}

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: initialUser,
    isLoading: false,
    isAuthenticated: !!initialUser,
  });

  /**
   * Fetch user profile from client-side
   */
  const fetchUser = async (): Promise<User | null> => {
    try {
      const response = await fetch('/api/auth/profile');
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const user = await fetchUser();
      setState({
        user,
        isLoading: false,
        isAuthenticated: !!user,
      });
    } catch (error) {
      console.error('Error refreshing user:', error);
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await loginAction(credentials);
      
      if (result.success) {
        // Refresh user data after successful login
        await refreshUser();
        return { success: true };
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: result.error };
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await registerAction(credentials);
      
      if (result.success) {
        // Refresh user data after successful registration
        await refreshUser();
        return { success: true };
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        return { success: false, error: result.error };
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      await logoutAction();
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      // Redirect to login after successful logout
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear the state even if server logout fails
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      // Redirect to login even on error
      router.replace('/login');
    }
  };

  useEffect(() => {
    if (!initialUser) {
      refreshUser();
    }
  }, [initialUser]);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}