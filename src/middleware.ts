import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: ['/dashboard/:path*'],
};

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value || request.headers.get('authorization')?.replace('Bearer ', '');
  
  console.log('Middleware - Path:', request.nextUrl.pathname, 'Token:', token ? 'exists' : 'missing');
  
  const protectedPaths = ['/dashboard'];
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));

  if (isProtectedPath && !token) {
    console.log('Middleware - Redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  console.log('Middleware - Allowing access');
  return NextResponse.next();
}
