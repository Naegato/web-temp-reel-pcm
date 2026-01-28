/**
 * Authentication utilities specifically for Next.js 16 proxy
 * These functions handle JWT token validation and user verification
 */

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const TOKEN_COOKIE_NAME = 'auth-token';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Validate JWT token by calling the backend API
 * This ensures the token is still valid and not expired
 */
async function validateToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

/**
 * Advanced authentication check that validates token with backend
 * Use this for sensitive routes that require token verification
 */
export async function isValidAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(TOKEN_COOKIE_NAME);
    
    if (!tokenCookie?.value) {
      return false;
    }

    // For performance, you might want to cache this validation
    // or only validate on certain routes
    const isValid = await validateToken(tokenCookie.value);
    return isValid;
  } catch (error) {
    console.error('Error validating authentication:', error);
    return false;
  }
}

/**
 * Simple authentication check that only verifies token existence
 * Use this for basic route protection where token validation isn't critical
 */
export async function hasAuthToken(request: NextRequest): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(TOKEN_COOKIE_NAME);
    return !!tokenCookie?.value;
  } catch (error) {
    console.error('Error checking auth token:', error);
    return false;
  }
}

/**
 * Get token from request for API forwarding
 */
export async function getProxyAuthToken(request: NextRequest): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(TOKEN_COOKIE_NAME);
    return tokenCookie?.value || null;
  } catch (error) {
    console.error('Error getting proxy auth token:', error);
    return null;
  }
}