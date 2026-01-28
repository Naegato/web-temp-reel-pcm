'use client';

/**
 * Client-side utilities for authentication
 * These work alongside server actions but provide client-side helpers
 */

/**
 * Check if user appears to be authenticated on client-side
 * Note: This is not secure and should only be used for UI state
 * Real authentication checks should always be done server-side
 */
export function isClientAuthenticated(): boolean {
  // We can't directly read httpOnly cookies from client-side
  // This function would need to call a server action or API route
  // For now, we rely on the auth context to provide this information
  return false;
}

/**
 * Redirect to login page from client-side
 */
export function redirectToLogin(currentPath?: string) {
  const loginUrl = new URL('/login', window.location.origin);
  if (currentPath) {
    loginUrl.searchParams.set('redirect', currentPath);
  }
  window.location.href = loginUrl.toString();
}

/**
 * Redirect to dashboard from client-side
 */
export function redirectToDashboard() {
  window.location.href = '/';
}

/**
 * Get redirect URL from query parameters
 */
export function getRedirectUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('redirect');
}