'use client';

import { useRouter } from 'next/navigation';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Client-side utilities for authentication using Next.js router
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
 * Hook for client-side redirections using Next.js router
 */
export function useAuthRedirects() {
  const router = useRouter();

  const redirectToLogin = (currentPath?: string) => {
    const loginPath = currentPath ? `/login?redirect=${encodeURIComponent(currentPath)}` : '/login';
    router.replace(loginPath);
  };

  const redirectToHome = () => {
    router.replace('/');
  };

  return { redirectToLogin, redirectToHome };
}

/**
 * Get redirect URL from query parameters - hook version
 */
export function useRedirectUrl(): string | null {
  const searchParams = useSearchParams();
  return searchParams.get('redirect');
}

/**
 * Get redirect URL from query parameters - non-hook version for backwards compatibility
 */
export function getRedirectUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('redirect');
}