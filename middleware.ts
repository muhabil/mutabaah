import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('mutabaah_session')?.value;
  const roleCookie = request.cookies.get('mutabaah_role')?.value;

  // Proteksi Route Admin (Mengatasi temuan T1: Server-Side Protection)
  if (pathname.startsWith('/admin')) {
    if (!sessionCookie || roleCookie !== 'admin') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Proteksi Route Musyrif
  if (pathname.startsWith('/musyrif')) {
    if (!sessionCookie || (roleCookie !== 'musyrif' && roleCookie !== 'admin')) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Proteksi Route Dashboard Anggota
  if (pathname.startsWith('/dashboard')) {
    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/musyrif/:path*', '/dashboard/:path*'],
};
