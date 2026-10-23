// Signed, httpOnly cookies that let the Next.js server (middleware) decide, BEFORE
// any admin page renders, whether a request may see the admin area.
//
//   kv_admin_entry   - lets a visitor open /admin/login (granted by /admin/enter?key=...)
//   kv_admin_session - issued only after the backend confirmed an admin / superadmin
//                      account (see app/api/admin-session). Required for every other
//                      /admin and /superadmin page.
//
// These cookies only decide what the frontend shows. All admin data still comes from
// the backend API, which verifies the token and the role in the database on every call.
// Uses Web Crypto so it runs in both the Edge middleware and Node route handlers.

export const ENTRY_COOKIE = 'kv_admin_entry';
export const SESSION_COOKIE = 'kv_admin_session';

export const ENTRY_TTL_SECONDS = 2 * 60 * 60;
export const SESSION_TTL_SECONDS = 12 * 60 * 60;

export type GatePayload = { t: 'entry' | 'session'; role?: 'admin' | 'superadmin'; exp: number };

const encoder = new TextEncoder();

const toBase64Url = (bytes: ArrayBuffer | Uint8Array) => {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (const b of Array.from(arr)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (value: string) => {
  const pad = value.length % 4 ? '='.repeat(4 - (value.length % 4)) : '';
  const bin = atob(value.replace(/-/g, '+').replace(/_/g, '/') + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

/** Server-only secrets. Missing => the gate stays closed (fail closed). */
export const gateSecret = () => (process.env.ADMIN_SESSION_SECRET || '').trim();
export const entryKey = () => (process.env.ADMIN_ENTRY_KEY || '').trim();

const hmacKey = async (secret: string) =>
  crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);

export async function signGate(payload: GatePayload): Promise<string | null> {
  const secret = gateSecret();
  if (secret.length < 32) return null;
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(body));
  return `${body}.${toBase64Url(sig)}`;
}

export async function verifyGate(value: string | undefined | null): Promise<GatePayload | null> {
  const secret = gateSecret();
  if (!value || secret.length < 32) return null;
  const [body, sig] = value.split('.');
  if (!body || !sig) return null;
  try {
    const ok = await crypto.subtle.verify(
      'HMAC',
      await hmacKey(secret),
      fromBase64Url(sig),
      encoder.encode(body)
    );
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as GatePayload;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now() / 1000) return null;
    if (payload.t !== 'entry' && payload.t !== 'session') return null;
    return payload;
  } catch {
    return null;
  }
}

/** Constant-time comparison (compares HMACs of both sides). */
export async function safeEqual(a: string, b: string) {
  const key = await hmacKey(gateSecret() || 'x'.repeat(32));
  const [x, y] = await Promise.all([
    crypto.subtle.sign('HMAC', key, encoder.encode(a)),
    crypto.subtle.sign('HMAC', key, encoder.encode(b)),
  ]);
  const xa = new Uint8Array(x);
  const ya = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < xa.length; i += 1) diff |= xa[i] ^ ya[i];
  return diff === 0;
}

export const cookieOptions = (maxAge: number, path: string) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path,
  maxAge,
});
