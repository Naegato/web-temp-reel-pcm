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
   * Fetch user profile ONLY from /auth/profile endpoint using Next.js cookies
   * This ensures data consistency and security
   * Automatically handles invalid tokens
   */
  const fetchUser = async (): Promise<User | null> => {
    try {
      // Use the API route that calls our backend /auth/profile
      const response = await fetch('/api/auth/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Always fetch fresh user data
      });
      
      if (response.ok) {
        const user = await response.json();
        
        // Validate that we received a proper user object with required fields
        if (user && user.id && user.email && user.firstname && user.lastname) {
          return user;
        } else {
          console.error('Invalid user data received from /auth/profile:', user);
          
          // Clean up invalid token if data is malformed
          await cleanupInvalidToken();
          return null;
        }
      } else if (response.status === 401 || response.status === 403) {
        // Token is invalid or expired
        console.log('Authentication failed, cleaning up invalid token');
        await cleanupInvalidToken();
        return null;
      } else {
        console.error('Failed to fetch user profile:', response.status, response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user from /auth/profile:', error);
      
      // On network error, don't clean up token as it might be temporary
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
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear the state even if server logout fails
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
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