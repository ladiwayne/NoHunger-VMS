import { NextResponse, type NextRequest } from 'next/server';

// Public paths that don't require authentication
const publicPaths = ['/sign-up-login-screen', '/reset-password', '/auth/callback', '/onboarding'];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?')
  );
}

interface JwtPayload {
  id: string;
  role: string;
  exp: number;
}

/** Decode our Express-issued JWT from the auth-token cookie (no network call). */
function getPayloadFromCookie(request: NextRequest): JwtPayload | null {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
    );
    if (!payload?.id && !payload?.sub) return null;
    return {
      id: payload.id || payload.sub,
      role: payload.role || 'volunteer',
      exp: payload.exp ?? 0,
    };
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const adminPaths = ['/admin'];
  const volunteerPaths = [
    '/volunteer-dashboard',
    '/hours-tracking',
    '/activities',
    '/invitations',
    '/checkin',
    '/profile',
    '/notifications',
  ];

  const isAdminPath = adminPaths.some((p) => pathname.startsWith(p));
  const isVolunteerPath = volunteerPaths.some((p) => pathname.startsWith(p));

  if (!isAdminPath && !isVolunteerPath) {
    return NextResponse.next();
  }

  const payload = getPayloadFromCookie(request);

  if (!payload) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-up-login-screen';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (payload.exp > 0 && payload.exp < nowSec) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-up-login-screen';
    url.searchParams.set('session_expired', '1');
    const res = NextResponse.redirect(url);
    res.cookies.set('auth-token', '', { maxAge: 0, path: '/' });
    return res;
  }

  const role = payload.role;

  if (role === 'admin' && isVolunteerPath) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }
  if (role !== 'admin' && isAdminPath) {
    return NextResponse.redirect(new URL('/volunteer-dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
