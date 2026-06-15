import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'auth-session';

interface SessionData {
  id: string;
  email: string;
  name: string;
  role: string;
}

async function verifySession(cookie: string): Promise<SessionData | null> {
  try {
    const dotIndex = cookie.lastIndexOf('.');
    if (dotIndex === -1) return null;

    const payload = cookie.slice(0, dotIndex);
    const sig = cookie.slice(dotIndex + 1);

    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!secret) return null;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const macBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const mac = Array.from(new Uint8Array(macBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (mac !== sig) return null;

    // Decode base64url → standard base64 → JSON
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  const session = sessionCookie ? await verifySession(sessionCookie) : null;

  if (pathname.startsWith('/admin')) {
    if (!session || session.role !== 'admin') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith('/advisor')) {
    if (!session || (session.role !== 'advisor' && session.role !== 'admin')) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect already-authenticated users away from the login page
  if (pathname === '/login' && session) {
    if (session.role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    if (session.role === 'advisor') {
      return NextResponse.redirect(new URL('/advisor/clients', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/advisor/:path*', '/login'],
};
