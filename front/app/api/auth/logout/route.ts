import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TOKEN_COOKIE_NAME } from '@/lib/auth/constants';

/**
 * API route for logout
 * Removes authentication cookie and returns success
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(TOKEN_COOKIE_NAME);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}

// Also support GET for simple logout links
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(TOKEN_COOKIE_NAME);
    
    // Redirect to login after logout
    return NextResponse.redirect(new URL('/login', request.url));
  } catch (error) {
    console.error('Logout API error:', error);
    // Still redirect to login even if cookie deletion fails
    return NextResponse.redirect(new URL('/login', request.url));
  }
}