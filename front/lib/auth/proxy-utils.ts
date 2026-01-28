import { NextRequest } from 'next/server';
import { isAuthenticatedWithValidation } from './token-validation';

/**
 * Check if a request is authenticated with token validation
 * This validates the token with the backend and removes invalid tokens
 */
export async function isRequestAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    return await isAuthenticatedWithValidation();
  } catch (error) {
    console.error('Error checking authentication in proxy:', error);
    return false;
  }
}

export async function getRequestAuthToken(request: NextRequest): Promise<string | null> {
  try {
    // Import here to avoid circular dependency
    const { getTokenFromCookies } = await import('./token-validation');
    return await getTokenFromCookies();
  } catch (error) {
    console.error('Error getting auth token in proxy:', error);
    return null;
  }
}

export function isPublicPath(pathname: string): boolean {
  const publicRoutes = [
    '/login',
    '/register',
  ];
  
  return publicRoutes.some(route => pathname.startsWith(route));
}

export function isAuthPath(pathname: string): boolean {
  const authRoutes = [
    '/login',
    '/register',
  ];
  
  return authRoutes.some(route => pathname.startsWith(route));
}

export function requiresAuth(pathname: string): boolean {
  return !isPublicPath(pathname);
}

export function shouldExcludePath(pathname: string): boolean {
  const excludedPaths = [
    '/api/',
    '/_next/',
    '/favicon.ico',
    '/public/',
  ];
  
  return excludedPaths.some(path => pathname.startsWith(path));
}