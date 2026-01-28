import { NextRequest, NextResponse } from 'next/server';
import { 
  isRequestAuthenticated, 
  isAuthPath,
  requiresAuth,
  shouldExcludePath 
} from '@/lib/auth/proxy-utils';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;


  if (shouldExcludePath(pathname)) {
    return NextResponse.next();
  }

  const isAuthenticated = await isRequestAuthenticated(request);

  const needsAuth = requiresAuth(pathname);
  const isAuthRoute = isAuthPath(pathname);

  if (needsAuth && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    // Add a redirect parameter to return to the original page after login
    // Only add redirect if it's not the root path
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

/**
 * Configure which routes the proxy should run on
 * Follows Next.js 16 proxy conventions
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.ico$).*)',
  ],
};