import { Role } from '@/lib/auth/types';
import { NextRequest, NextResponse } from 'next/server';
import { getApiClient } from '@/lib/api-client';

const authRoutes = ['/login', '/register'];
const roleBasedRoutes: Record<string, Role[]> = {
  '/': [Role.USER, Role.ADVISOR],
  '/chat': [Role.USER, Role.ADVISOR],
  '/connect': [Role.ADVISOR],
};

function getRequiredRoles(path: string): Role[] | null {
  for (const [route, roles] of Object.entries(roleBasedRoutes)) {
    if (path === route || path.startsWith(route + '/')) {
      return roles;
    }
  }
  return null;
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('token')?.value;
  const requiredRoles = getRequiredRoles(path);

  if (token) {
    const result = await getApiClient(token).me();

    if ('error' in result) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }

    if (authRoutes.includes(path)) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (requiredRoles && !requiredRoles.includes(result.role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  }

  if (requiredRoles) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/chat/:path*',
    '/connect/:path*',
    '/login',
    '/register',
  ],
}