import { NextResponse } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-key-12345'
);

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Define public paths that don't need authentication
  const isPublicPage = pathname === '/login';
  const isAuthApi = pathname.startsWith('/api/auth') || pathname === '/api/debug/env';
  const isStaticFile = 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/favicon.ico') || 
    pathname.startsWith('/images') ||
    pathname.startsWith('/uploads') ||
    pathname.includes('.'); // files like .png, .jpg, etc.

  if (isAuthApi || isStaticFile) {
    return NextResponse.next();
  }

  // Get token
  const token = request.cookies.get('hd_token')?.value;

  // Verify token
  let isAuthenticated = false;
  if (token) {
    try {
      await jose.jwtVerify(token, JWT_SECRET);
      isAuthenticated = true;
    } catch (e) {
      isAuthenticated = false;
    }
  }

  // Redirect logic
  if (!isAuthenticated && !isPublicPage) {
    const loginUrl = new URL('/login', request.url);
    
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      );
    }

    const response = NextResponse.redirect(loginUrl);
    if (token) {
      response.cookies.delete('hd_token');
    }
    return response;
  }

  if (isAuthenticated && isPublicPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
