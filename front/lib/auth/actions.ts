'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiClient, type LoginCredentials, type RegisterCredentials } from '@/lib/api/client';

const TOKEN_COOKIE_NAME = 'auth-token';

/**
 * Get cookie options with proper typing
 */
function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  };
}

/**
 * Server action for user login
 * Stores JWT token in httpOnly cookie using Next.js cookies()
 */
export async function loginAction(credentials: LoginCredentials) {
  try {
    const response = await apiClient.login(credentials);

    if (response.error || !response.data?.access_token) {
      return {
        success: false,
        error: response.error || 'Login failed',
      };
    }

    // Store token in httpOnly cookie using Next.js cookies()
    const cookieStore = await cookies();
    cookieStore.set(TOKEN_COOKIE_NAME, response.data.access_token, getCookieOptions());

    return {
      success: true,
      token: response.data.access_token,
    };
  } catch (error) {
    console.error('Login action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

/**
 * Server action for user registration  
 * Stores JWT token in httpOnly cookie using Next.js cookies()
 */
export async function registerAction(credentials: RegisterCredentials) {
  try {
    const response = await apiClient.register(credentials);

    if (response.error || !response.data?.access_token) {
      return {
        success: false,
        error: response.error || 'Registration failed',
      };
    }

    // Store token in httpOnly cookie using Next.js cookies()
    const cookieStore = await cookies();
    cookieStore.set(TOKEN_COOKIE_NAME, response.data.access_token, getCookieOptions());

    return {
      success: true,
      token: response.data.access_token,
    };
  } catch (error) {
    console.error('Register action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

/**
 * Server action for user logout
 * Removes authentication cookie using Next.js cookies()
 */
export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(TOKEN_COOKIE_NAME);
    
    return {
      success: true,
    };
  } catch (error) {
    console.error('Logout action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Logout failed',
    };
  }
}

/**
 * Get current user token from cookie using Next.js cookies()
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_COOKIE_NAME);
    return token?.value || null;
  } catch (error) {
    console.error('Get auth token error:', error);
    return null;
  }
}

/**
 * Check if user is authenticated with token validation
 * This validates the token and removes invalid ones
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { isAuthenticatedWithValidation } = await import('./token-validation');
    return await isAuthenticatedWithValidation();
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

/**
 * Force token cleanup - removes invalid tokens
 * Use this when you detect an invalid token client-side
 */
export async function cleanupInvalidToken() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(TOKEN_COOKIE_NAME);
    
    return {
      success: true,
    };
  } catch (error) {
    console.error('Error cleaning up invalid token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Cleanup failed',
    };
  }
}

/**
 * Redirect to login if not authenticated
 */
export async function requireAuth() {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    redirect('/login');
  }
}