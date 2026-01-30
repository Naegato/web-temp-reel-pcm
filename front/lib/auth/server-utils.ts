import { serverApiClient } from '@/lib/api/server-client';
import { validateTokenAndCleanup } from './token-validation';
import type { User } from '@/lib/api/client';

/**
 * Get current user from server-side using Next.js cookies()
 * ONLY fetches data from /auth/profile endpoint
 * Validates token and removes invalid ones automatically
 * Returns null if not authenticated or error occurs
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    // First, validate the token (this will delete invalid tokens)
    const isValidToken = await validateTokenAndCleanup();
    if (!isValidToken) {
      // No valid auth token found
      return null;
    }

    // This calls /auth/profile on the backend API
    const response = await serverApiClient.getProfile();
    
    if (response.error || response.status !== 200) {
      console.error('Failed to get current user from /auth/profile:', {
        error: response.error,
        status: response.status
      });
      
      // If the API call failed, the token might be invalid
      // The validation function already handles token cleanup
      return null;
    }

    const user = response.data;
    
    // Validate that we received proper user data from /auth/profile
    if (!user || !user.id || !user.email || !user.firstname || !user.lastname) {
      console.error('Invalid user data received from /auth/profile:', user);
      return null;
    }

    // User fetched successfully

    return user;
  } catch (error) {
    console.error('Error getting current user from /auth/profile:', error);
    return null;
  }
}