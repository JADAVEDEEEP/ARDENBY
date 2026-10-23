// Front-end route-protection logic: which screen an admin / customer gets, where
// the login sends them back to, and what is never allowed to happen (open
// redirects, signing a legitimate admin out because of a network error).
// The real modules are loaded; only fetch and browser storage are simulated.
// The server-side half (401 / 403 on every endpoint) is in the backend's
// tests/security.test.js.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const Module = require('module');

const frontendRoot = path.join(__dirname, '..');

function makeStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => void data.set(k, String(v)),
    removeItem: (k) => void data.delete(k),
    clear: () => data.clear(),
  };
}

const events = [];
const win = new EventTarget();
win.dispatchEvent = ((original) => (event) => {
  events.push(event.type);
  return original.call(win, event);
})(win.dispatchEvent);
globalThis.window = win;
globalThis.localStorage = makeStorage();
globalThis.sessionStorage = makeStorage();
win.location = { hostname: 'localhost', search: '' };

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request.startsWith('@/')) {
    return originalResolve.call(this, path.join(frontendRoot, request.slice(2)), ...rest);
  }
  return originalResolve.call(this, request, ...rest);
};
require(path.join(frontendRoot, 'node_modules', 'sucrase', 'register'));

const redirect = require(path.join(frontendRoot, 'lib', 'auth-redirect.ts'));
const adminAuth = require(path.join(frontendRoot, 'components', 'admin', 'admin-auth.ts'));
const { decideAdminAccess } = require(path.join(
  frontendRoot,
  'components',
  'admin',
  'admin-access-decision.ts'
));

const jsonResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

test.beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  events.length = 0;
});

// --------------------------------------------------- return-path validation --
test('only same-site paths are ever accepted as a return destination', () => {
  const evil = [
    'https://evil.example/admin',
    '//evil.example/admin',
    '/\\evil.example',
    '\\\\evil.example',
    'javascript:alert(1)',
    'admin',
    '',
    '/%2fevil.example',
    '/%5cevil.example',
    '/admin\nSet-Cookie: x=1',
    '/admin\u0000',
    `/${'a'.repeat(600)}`,
    null,
    undefined,
    { path: '/admin' },
    ['/admin'],
  ];

  for (const value of evil) {
    assert.equal(redirect.safeInternalPath(value), null, `accepted ${JSON.stringify(value)}`);
  }

  assert.equal(redirect.safeInternalPath('/orders/abc?x=1#top'), '/orders/abc?x=1#top');
});

test('the admin login only returns to admin pages, never to the login page or elsewhere', () => {
  assert.equal(redirect.safeAdminPath('/admin'), '/admin');
  assert.equal(redirect.safeAdminPath('/admin/orders?status=Packed'), '/admin/orders?status=Packed');
  assert.equal(redirect.safeAdminPath('/superadmin/users'), '/superadmin/users');

  for (const value of ['/', '/profile', '/administrator', '/admin/login', '/admin/login?next=/admin', '//admin', 'https://x/admin']) {
    assert.equal(redirect.safeAdminPath(value), null, value);
  }
});

// --------------------------------------------- direct URL -> login -> back --
test('opening an admin URL while signed out sends you to login and back to that exact page', () => {
  const wanted = '/admin/orders?status=Packed&page=2';

  const loginUrl = redirect.adminLoginUrl(wanted);
  assert.equal(loginUrl, `/admin/login?next=${encodeURIComponent(wanted)}`);

  const next = new URL(loginUrl, 'http://localhost').searchParams.get('next');
  assert.equal(redirect.adminDestination('admin', next), wanted);
  assert.equal(redirect.adminDestination('superadmin', next), wanted);
});

test('with no (or a hostile) ?next= the admin lands on their own dashboard', () => {
  assert.equal(redirect.adminDestination('admin', null), '/admin');
  assert.equal(redirect.adminDestination('superadmin', null), '/superadmin');
  assert.equal(redirect.adminDestination('admin', 'https://evil.example'), '/admin');
  assert.equal(redirect.adminDestination('admin', '//evil.example'), '/admin');
  assert.equal(redirect.adminLoginUrl('https://evil.example'), '/admin/login');
  assert.equal(redirect.adminLoginUrl('/profile'), '/admin/login');
});

test('a plain admin is not sent into the super admin area after login', () => {
  assert.equal(redirect.adminDestination('admin', '/superadmin/users'), '/admin');
  assert.equal(redirect.adminDestination('superadmin', '/superadmin/users'), '/superadmin/users');
});

// --------------------------------------------------------- access decisions --
test('a verified admin or super admin is allowed (refresh / direct URL)', () => {
  assert.deepEqual(decideAdminAccess({ kind: 'user', role: 'admin' }, 'admin'), { status: 'allowed' });
  assert.deepEqual(decideAdminAccess({ kind: 'user', role: 'superadmin' }, 'admin'), { status: 'allowed' });
  assert.deepEqual(decideAdminAccess({ kind: 'user', role: 'superadmin' }, 'superadmin'), { status: 'allowed' });
});

test('a customer (or any non-admin role) gets the 403 screen, not the dashboard', () => {
  for (const role of ['customer', undefined, '', 'ADMIN', 'owner']) {
    assert.deepEqual(decideAdminAccess({ kind: 'user', role }, 'admin'), { status: 'denied' }, String(role));
    assert.deepEqual(decideAdminAccess({ kind: 'user', role }, 'superadmin'), { status: 'denied' }, String(role));
  }
});

test('an admin who is not a super admin is redirected out of /superadmin', () => {
  assert.deepEqual(decideAdminAccess({ kind: 'user', role: 'admin' }, 'superadmin'), { status: 'admin-home' });
});

test('only a rejected session (401) signs the admin out; outages never do', () => {
  const err = (status) => new adminAuth.AdminApiError('x', status);

  assert.deepEqual(decideAdminAccess({ kind: 'error', error: err(401) }, 'admin'), { status: 'login', clearToken: true });
  assert.deepEqual(decideAdminAccess({ kind: 'error', error: err(403) }, 'admin'), { status: 'denied' });

  for (const status of [0, 429, 500, 502, 503]) {
    assert.deepEqual(decideAdminAccess({ kind: 'error', error: err(status) }, 'admin'), { status: 'retry' }, `status ${status}`);
  }
  assert.deepEqual(decideAdminAccess({ kind: 'error', error: new Error('boom') }, 'admin'), { status: 'retry' });
});

// ------------------------------------- the real API client + the decisions --
const check = async (fetchImpl) => {
  globalThis.fetch = fetchImpl;
  localStorage.setItem(adminAuth.ADMIN_TOKEN_KEY, 'token-123');
  try {
    const user = await adminAuth.getCurrentAdmin();
    return decideAdminAccess({ kind: 'user', role: user.role }, 'admin');
  } catch (error) {
    return decideAdminAccess({ kind: 'error', error }, 'admin');
  }
};

test('end to end: the stored token is sent, and the server answer decides the screen', async () => {
  let seenAuth = null;

  const allowed = await check(async (url, options) => {
    seenAuth = new Headers(options.headers).get('Authorization');
    assert.match(url, /\/api\/users\/me$/);
    return jsonResponse(200, { user: { id: 'u1', full_name: 'Owner', email: 'o@x.test', role: 'admin' } });
  });
  assert.equal(seenAuth, 'Bearer token-123');
  assert.deepEqual(allowed, { status: 'allowed' });

  const customer = await check(async () => jsonResponse(200, { user: { id: 'u2', role: 'customer' } }));
  assert.deepEqual(customer, { status: 'denied' });

  const expired = await check(async () => jsonResponse(401, { message: 'Token has expired.' }));
  assert.deepEqual(expired, { status: 'login', clearToken: true });

  const forbidden = await check(async () => jsonResponse(403, { message: 'nope' }));
  assert.deepEqual(forbidden, { status: 'denied' });
});

test('a network failure or server error keeps the admin signed in', async () => {
  const offline = await check(async () => {
    throw new TypeError('Failed to fetch');
  });
  assert.deepEqual(offline, { status: 'retry' });

  const down = await check(async () => jsonResponse(503, { message: 'Unable to verify your session right now.' }));
  assert.deepEqual(down, { status: 'retry' });

  assert.equal(localStorage.getItem(adminAuth.ADMIN_TOKEN_KEY), 'token-123', 'token must survive an outage');
});

test('with no stored token there is nothing to send', () => {
  assert.equal(adminAuth.getAdminToken(), null);
});

// ------------------------------------------------------ customer return trip --
test('a customer who was sent to sign in is returned to the page they wanted', () => {
  redirect.rememberReturnTo('/orders/ord-42?from=email');
  assert.equal(redirect.consumeReturnTo(), '/orders/ord-42?from=email');
  // consumed once: a later, unrelated sign-in goes to the home page
  assert.equal(redirect.consumeReturnTo(), null);
});

test('the remembered customer page expires and rejects hostile values', () => {
  redirect.rememberReturnTo('https://evil.example');
  assert.equal(redirect.consumeReturnTo(), null);

  sessionStorage.setItem(
    redirect.CUSTOMER_RETURN_KEY,
    JSON.stringify({ path: '/checkout', at: Date.now() - 60 * 60 * 1000 })
  );
  assert.equal(redirect.consumeReturnTo(), null);

  sessionStorage.setItem(redirect.CUSTOMER_RETURN_KEY, '{not json');
  assert.equal(redirect.consumeReturnTo(), null);

  sessionStorage.setItem(
    redirect.CUSTOMER_RETURN_KEY,
    JSON.stringify({ path: '//evil.example', at: Date.now() })
  );
  assert.equal(redirect.consumeReturnTo(), null);
});

test('clearing the remembered page forgets it', () => {
  redirect.rememberReturnTo('/profile');
  redirect.clearReturnTo();
  assert.equal(redirect.consumeReturnTo(), null);
});
