import { NextRequest, NextResponse } from 'next/server';
import { getProxyAuthToken } from '@/lib/auth/proxy-auth';

/**
 * Get auth token for WebSocket connections
 * This endpoint provides the JWT token for client-side WebSocket authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Récupérer le token depuis les cookies httpOnly
    const token = await getProxyAuthToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Retourner le token pour WebSocket
    return NextResponse.json({
      token,
      message: 'Token retrieved for WebSocket authentication'
    });
  } catch (error) {
    console.error('WebSocket token API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}