import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that require authentication
  const isProtectedPath = 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/faculty') || 
    pathname.startsWith('/student');

  // Paths that are public but shouldn't be accessed if logged in
  const isAuthPath = pathname === '/login' || pathname === '/';

  // Check for the refresh token to determine loosely if the user is authenticated.
  // The actual validation happens on the backend. This just prevents UI flashes.
  const hasSession = request.cookies.has('refreshToken');

  if (isProtectedPath && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Optionally: redirect away from login if already authenticated
  // We can't know the role precisely here without decoding the JWT or making a DB call,
  // so we'll just let the client-side handle the final role redirect if they hit /login
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (e.g., .svg, .png)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
