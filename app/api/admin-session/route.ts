import { NextRequest, NextResponse } from 'next/server';

import {
  ENTRY_COOKIE,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  cookieOptions,
  signGate,
  verifyGate,
} from '@/lib/admin-gate';
import { apiUrl } from '@/lib/api-url';

export const dynamic = 'force-dynamic';

const json = (body: object, status: number) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

// Called by the admin login page after a successful sign-in. The token is checked
// against the backend here, on the server: the cookie is only issued when the
// backend says this account really is an admin or superadmin.
export async function POST(request: NextRequest) {
  const entry = await verifyGate(request.cookies.get(ENTRY_COOKIE)?.value);
  const existing = await verifyGate(request.cookies.get(SESSION_COOKIE)?.value);
  if (!entry && !existing) return json({ success: false }, 404);

  const body = await request.json().catch(() => ({}));
  const token = typeof body?.token === 'string' ? body.token : '';
  if (!token || token.length > 4000) return json({ success: false }, 400);

  let role: string | undefined;
  try {
    const res = await fetch(apiUrl('/api/users/me'), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.status === 401) return json({ success: false }, 401);
    if (!res.ok) return json({ success: false }, 503);
    role = (await res.json())?.user?.role;
  } catch {
    return json({ success: false }, 503);
  }

  if (role !== 'admin' && role !== 'superadmin') return json({ success: false }, 403);

  const cookie = await signGate({
    t: 'session',
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  });
  if (!cookie) return json({ success: false, message: 'Admin gate is not configured.' }, 503);

  const response = json({ success: true, role }, 200);
  response.cookies.set(SESSION_COOKIE, cookie, cookieOptions(SESSION_TTL_SECONDS, '/'));
  return response;
}

// Sign-out: drops the server-side session cookie.
export async function DELETE() {
  const response = json({ success: true }, 200);
  response.cookies.set(SESSION_COOKIE, '', cookieOptions(0, '/'));
  return response;
}
