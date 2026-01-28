import { NextRequest, NextResponse } from 'next/server';
import { validateTokenAndCleanup } from '@/lib/auth/token-validation';

/**
 * API route to validate authentication token
 * Automatically cleans up invalid tokens
 */
export async function GET(request: NextRequest) {
  try {
    const isValid = await validateTokenAndCleanup();
    
    if (isValid) {
      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json({ valid: false }, { status: 401 });
    }
  } catch (error) {
    console.error('Token validation API error:', error);
    return NextResponse.json(
      { valid: false, error: 'Validation failed' },
      { status: 500 }
    );
  }
}