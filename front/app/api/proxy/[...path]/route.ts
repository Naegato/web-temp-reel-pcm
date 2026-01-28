import { NextRequest, NextResponse } from 'next/server';
import { getProxyAuthToken } from '@/lib/auth/proxy-auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * API Proxy route that forwards requests to backend API
 * Automatically injects authentication headers from Next.js cookies
 */
async function handleRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const pathname = Array.isArray(path) ? path.join('/') : path;
    
    // Get auth token from cookies
    const token = await getProxyAuthToken(request);
    
    // Build target URL
    const targetUrl = `${API_BASE_URL}/${pathname}`;
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add auth header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Copy relevant headers from original request
    const originalHeaders = request.headers;
    if (originalHeaders.get('user-agent')) {
      headers['User-Agent'] = originalHeaders.get('user-agent')!;
    }
    
    // Get request body for POST/PUT/PATCH requests
    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      body = await request.text();
    }
    
    // Copy search params
    const url = new URL(targetUrl);
    request.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    
    // Make the request to backend API
    const response = await fetch(url.toString(), {
      method: request.method,
      headers,
      body,
    });
    
    // Get response data
    const responseData = await response.text();
    
    // Create response with same status and headers
    const proxyResponse = new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
    });
    
    // Copy relevant response headers
    response.headers.forEach((value, key) => {
      // Skip certain headers that shouldn't be forwarded
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
        proxyResponse.headers.set(key, value);
      }
    });
    
    return proxyResponse;
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export all HTTP methods
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;