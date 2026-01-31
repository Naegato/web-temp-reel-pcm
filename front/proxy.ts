import { NextRequest, NextResponse } from 'next/server';
import { getApiClient } from '@/lib/api-client';

const protectedRoutes = ['/', '/chat'];
const authRoutes = ['/login', '/register'];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get('token')?.value;

  if (token) {
    const result = await getApiClient(token).me();

    if ('error' in result) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }

    if (authRoutes.includes(path)) {
      return NextResponse.redirect(new URL('/', request.url));
    } else {
      return NextResponse.next();
    }
  }

  if (protectedRoutes.some(route => path === route || path.startsWith(route + '/')) && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/chat/:path*',
    '/login',
    '/register',
  ],
}