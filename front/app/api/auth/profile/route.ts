import { NextRequest, NextResponse } from 'next/server';
import { serverApiClient } from '@/lib/api/server-client';

/**
 * API route to get user profile using Next.js cookies() for authentication
 */
export async function GET(request: NextRequest) {
  try {
    const response = await serverApiClient.getProfile();

    if (response.error || response.status !== 200) {
      return NextResponse.json(
        { error: response.error || 'Failed to fetch profile' },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Profile API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}