/**
 * Client-side logout utilities using Next.js router
 */

'use client';

import { useRouter } from 'next/navigation';

/**
 * Hook for logout functionality using Next.js router
 * Use this in components that need logout functionality
 */
export function useLogout() {
  const router = useRouter();

  const logout = async () => {
    try {
      // Call logout API to clear server-side cookie
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error during logout API call:', error);
      // Continue with redirect even if API call fails
    } finally {
      // Use Next.js router for navigation
      router.replace('/login');
    }
  };

  const logoutWithConfirmation = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await logout();
    }
  };

  return { logout, logoutWithConfirmation };
}

/**
 * Emergency logout - only use as last resort
 * This bypasses Next.js router and should be avoided unless absolutely necessary
 */
export function emergencyLogout() {
  console.warn('Using emergency logout - this should only be used as a last resort');
  
  // Clear any local storage or session storage if used
  try {
    localStorage.removeItem('user');
    sessionStorage.clear();
  } catch (error) {
    // Ignore errors, this is just cleanup
  }
  
  // Only use window.location as absolute last resort
  window.location.replace('/login');
}