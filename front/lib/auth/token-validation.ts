import { cookies } from 'next/headers';

const TOKEN_COOKIE_NAME = 'auth-token';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Validate token by calling the backend /auth/profile endpoint
 * If token is invalid, automatically delete it from cookies
 * Returns true if token is valid, false otherwise
 */
export async function validateTokenAndCleanup(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(TOKEN_COOKIE_NAME);
    
    if (!tokenCookie?.value) {
      console.log('No token found in cookies');
      return false;
    }

    const token = tokenCookie.value;
    console.log('Validating token with backend...');

    // Call backend API to validate token
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('Token validation successful');
      return true;
    } else {
      console.log('Token validation failed:', response.status, response.statusText);
      
      // Token is invalid, delete it from cookies
      await deleteInvalidToken();
      return false;
    }
  } catch (error) {
    console.error('Error validating token:', error);
    
    // On error, assume token is invalid and delete it
    await deleteInvalidToken();
    return false;
  }
}

/**
 * Delete invalid token from cookies
 */
async function deleteInvalidToken(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(TOKEN_COOKIE_NAME);
    console.log('Invalid token deleted from cookies');
  } catch (error) {
    console.error('Error deleting invalid token:', error);
  }
}

/**
 * Get token from cookies without validation
 * Use this only when you need the raw token value
 */
export async function getTokenFromCookies(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(TOKEN_COOKIE_NAME);
    return tokenCookie?.value || null;
  } catch (error) {
    console.error('Error getting token from cookies:', error);
    return null;
  }
}

/**
 * Check if user is authenticated with token validation
 * This is the main function to use for authentication checks
 */
export async function isAuthenticatedWithValidation(): Promise<boolean> {
  return await validateTokenAndCleanup();
}