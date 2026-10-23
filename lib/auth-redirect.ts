// "Send me back where I was going" helpers for the admin and customer logins.
//
// Every return path is validated before it is used: only same-site paths are
// accepted, so a crafted ?next=https://evil.example (or //evil.example) can never
// turn the login page into an open redirect.

export const ADMIN_LOGIN_PATH = '/admin/login';
export const CUSTOMER_RETURN_KEY = 'ardenby_return_to';

const MAX_PATH_LENGTH = 500;
const RETURN_TTL_MS = 15 * 60 * 1000;

/** A same-site path ("/orders/1?x=2") or null. */
export function safeInternalPath(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;

  const value = raw.trim();

  if (!value || value.length > MAX_PATH_LENGTH) return null;
  if (!value.startsWith('/')) return null;
  // "//host" and "/\host" are protocol-relative / browser-normalised to a host.
  if (value.startsWith('//') || value.includes('\\')) return null;
  // Control characters, whitespace tricks and encoded slashes/backslashes at the start.
  if (/[\u0000-\u001f\u007f]/.test(value)) return null;
  if (/^\/(%2f|%5c)/i.test(value)) return null;

  return value;
}

const pathOnly = (path: string) => path.split(/[?#]/)[0];

const isUnder = (path: string, base: string) => {
  const p = pathOnly(path);
  return p === base || p.startsWith(`${base}/`);
};

/** Admin-area path that is allowed as a post-login destination (never the login page itself). */
export function safeAdminPath(raw: unknown): string | null {
  const path = safeInternalPath(raw);

  if (!path) return null;
  if (!isUnder(path, '/admin') && !isUnder(path, '/superadmin')) return null;
  if (isUnder(path, ADMIN_LOGIN_PATH)) return null;

  return path;
}

/** Where to send someone who has to sign in before opening `path`. */
export function adminLoginUrl(path?: string | null) {
  const target = safeAdminPath(path);

  return target
    ? `${ADMIN_LOGIN_PATH}?next=${encodeURIComponent(target)}`
    : ADMIN_LOGIN_PATH;
}

/** The page to open after a successful admin login. */
export function adminDestination(role: string | undefined, next: unknown) {
  const target = safeAdminPath(next);

  // Only the super admin may land on /superadmin/*.
  if (target && (role === 'superadmin' || !isUnder(target, '/superadmin'))) {
    return target;
  }

  return role === 'superadmin' ? '/superadmin' : '/admin';
}

// ---------------------------------------------------------------------------
// Customer area: the sign-in is a modal on the same URL, so the page the
// customer wanted is remembered briefly and reopened after sign-in.
// ---------------------------------------------------------------------------

export function rememberReturnTo(path: string, storage?: Storage) {
  const safe = safeInternalPath(path);

  if (!safe) return;

  try {
    (storage ?? sessionStorage).setItem(
      CUSTOMER_RETURN_KEY,
      JSON.stringify({ path: safe, at: Date.now() })
    );
  } catch {
    // Private mode etc.: the customer simply lands on the home page after login.
  }
}

export function clearReturnTo(storage?: Storage) {
  try {
    (storage ?? sessionStorage).removeItem(CUSTOMER_RETURN_KEY);
  } catch {
    // ignore
  }
}

/** Returns (and forgets) the remembered page if it is recent and valid. */
export function consumeReturnTo(storage?: Storage): string | null {
  try {
    const store = storage ?? sessionStorage;
    const raw = store.getItem(CUSTOMER_RETURN_KEY);

    store.removeItem(CUSTOMER_RETURN_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw) as { path?: unknown; at?: unknown };

    if (typeof parsed.at !== 'number' || Date.now() - parsed.at > RETURN_TTL_MS) {
      return null;
    }

    return safeInternalPath(parsed.path);
  } catch {
    return null;
  }
}
