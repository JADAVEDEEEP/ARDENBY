import { NextRequest, NextResponse } from 'next/server';

import {
  ENTRY_COOKIE,
  ENTRY_TTL_SECONDS,
  SESSION_COOKIE,
  cookieOptions,
  entryKey,
  safeEqual,
  signGate,
  verifyGate,
} from '@/lib/admin-gate';

// Runs on the server BEFORE any /admin or /superadmin page is rendered.
// Anyone without the right cookie gets a bare 404 - no login form, no dashboard
// markup, nothing that reveals the admin area exists.
//
//   /admin/enter?key=...   exchanges the private entry key for a short-lived entry
//                          cookie, then redirects to /admin/login
//   /admin/login           needs the entry cookie (or an admin session)
//   everything else        needs an admin session (superadmin pages: superadmin only)
//
// The entry key only reveals the login form. Signing in still needs the account's
// password + emailed OTP, and the backend re-checks the role on every API call.

const notFound = () =>
  new NextResponse('Not Found', {
    status: 404,
    headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === '/admin/enter') {
    const key = searchParams.get('key') || '';
    const configured = entryKey();

    if (!configured || configured.length < 24 || !key || !(await safeEqual(key, configured))) {
      return notFound();
    }

    const cookie = await signGate({
      t: 'entry',
      exp: Math.floor(Date.now() / 1000) + ENTRY_TTL_SECONDS,
    });
    if (!cookie) return notFound();

    const target = new URL('/admin/login', request.url);
    const next = searchParams.get('next');
    if (next) target.searchParams.set('next', next);

    const response = NextResponse.redirect(target);
    response.cookies.set(ENTRY_COOKIE, cookie, cookieOptions(ENTRY_TTL_SECONDS, '/'));
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  const session = await verifyGate(request.cookies.get(SESSION_COOKIE)?.value);
  const hasSession = session?.t === 'session' && !!session.role;

  if (pathname === '/admin/login') {
    const entry = await verifyGate(request.cookies.get(ENTRY_COOKIE)?.value);
    if (hasSession || entry?.t === 'entry') return NextResponse.next();
    return notFound();
  }

  if (pathname === '/superadmin' || pathname.startsWith('/superadmin/')) {
    return hasSession && session?.role === 'superadmin' ? NextResponse.next() : notFound();
  }

  return hasSession ? NextResponse.next() : notFound();
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/superadmin', '/superadmin/:path*'],
};
