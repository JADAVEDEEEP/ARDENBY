// End-to-end cart flow: the REAL zustand store + the REAL backend controllers/services.
// Only the network (fetch -> controllers) and the database (in-memory) are simulated.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const Module = require('module');

const frontendRoot = path.join(__dirname, '..');
const backendRoot = path.join(frontendRoot, '..', 'ArdenBy_Backend');

// ---- browser globals the store expects -------------------------------------
function makeStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => void data.set(k, String(v)),
    removeItem: (k) => void data.delete(k),
    clear: () => data.clear(),
  };
}
const win = new EventTarget();
globalThis.window = win;
globalThis.localStorage = makeStorage();
globalThis.sessionStorage = makeStorage();
win.localStorage = globalThis.localStorage;
win.location = { hostname: 'localhost' };

// ---- module resolution: '@/...' alias, sonner stub, TS via sucrase ----------
const toasts = [];
const notices = [];
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request.startsWith('@/')) {
    return originalResolve.call(this, path.join(frontendRoot, request.slice(2)), ...rest);
  }
  if (request === 'sonner') return 'sonner-stub';
  return originalResolve.call(this, request, ...rest);
};
require.cache['sonner-stub'] = {
  id: 'sonner-stub',
  filename: 'sonner-stub',
  loaded: true,
  exports: { toast: { error: (m) => toasts.push(m), success: () => undefined, message: (m) => notices.push(m) } },
};
require(path.join(frontendRoot, 'node_modules', 'sucrase', 'register'));

// ---- fake DB + real backend --------------------------------------------------
const {
  createFakeDb, installFakePool, callController, seedCatalog,
} = require(path.join(backendRoot, 'tests', 'helpers', 'fake-db'));
const { db, pool } = createFakeDb();
installFakePool(backendRoot, pool);
const cartController = require(path.join(backendRoot, 'controller', 'cart.controller'));
const couponController = require(path.join(backendRoot, 'controller', 'coupon.controller'));
const { calculateOrderTotals } = require(path.join(backendRoot, 'utils', 'pricing'));

const routes = [
  ['POST', /^\/api\/cart\/stock-check$/, cartController.checkStock, false],
  ['GET', /^\/api\/cart$/, cartController.getCart, true],
  ['DELETE', /^\/api\/cart$/, cartController.clearCart, true],
  ['POST', /^\/api\/cart\/items$/, cartController.addCartItem, true],
  ['PUT', /^\/api\/cart\/items\/([^/]+)$/, cartController.updateCartItem, true, 'itemId'],
  ['DELETE', /^\/api\/cart\/items\/([^/]+)$/, cartController.removeCartItem, true, 'itemId'],
  ['PATCH', /^\/api\/cart\/coupon$/, cartController.updateCartCoupon, true],
  ['POST', /^\/api\/coupons\/validate$/, couponController.validateCoupon, true],
];

globalThis.fetch = async (url, options = {}) => {
  const pathname = new URL(url).pathname;
  const method = (options.method || 'GET').toUpperCase();
  const auth = new Headers(options.headers).get('Authorization');
  const user = auth ? { id: auth.replace('Bearer tok-', '') } : undefined;

  for (const [m, pattern, handler, needsAuth, paramName] of routes) {
    const match = pathname.match(pattern);
    if (m !== method || !match) continue;
    if (needsAuth && !user) {
      return { ok: false, status: 401, json: async () => ({ message: 'Unauthorized' }) };
    }
    const result = await callController(handler, {
      user,
      body: options.body ? JSON.parse(options.body) : {},
      params: paramName ? { [paramName]: match[1] } : {},
    });
    return { ok: result.status < 400, status: result.status, json: async () => result.body };
  }
  throw new Error(`No route for ${method} ${pathname}`);
};

const originalError = console.error;
console.error = () => undefined; // expected rejections log noise

const store = require(path.join(frontendRoot, 'store', 'cart-store.ts'));
const { calculateCartPricing } = require(path.join(frontendRoot, 'lib', 'pricing.ts'));
const cart = store.useCartStore;

const GUEST_KEY = 'ardenby-cart-guest';
const COUPON_KEY = 'kovenik_applied_coupon';

const item = (productId, variantId, size, color, price, mrp) => ({
  productId, variantId, slug: productId, name: productId, image: '', size, color, price, mrp,
});
const OXFORD_M = item('p1', 'v1', 'M', 'Black', 1000, 1500); // inventory 3
const OXFORD_L = item('p1', 'v2', 'L', 'Black', 1000, 1500); // inventory 1
const TEE = item('p2', 'v3', 'M', 'Navy', 300, 400); // inventory 10

const login = (id) => localStorage.setItem('ardenby_token', `tok-${id}`);
const logout = () => {
  localStorage.removeItem('ardenby_token');
  cart.getState().switchToGuest(); // what Navbar does on every auth change
};
const loginAndLoad = async (id) => {
  login(id);
  await cart.getState().loadUserCart();
};
const guestStored = () => JSON.parse(localStorage.getItem(GUEST_KEY) || '[]');
const lineQty = (variantId) => cart.getState().items.find((i) => i.variantId === variantId)?.quantity;

// Mirrors CartDrawer.handleApplyCoupon: validate -> save on server -> persist rule -> apply.
async function applyCouponLikeDrawer(code) {
  const subtotal = store.getCartSubtotal(cart.getState().items);
  const res = await fetch('http://x/api/coupons/validate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${localStorage.getItem('ardenby_token')}` },
    body: JSON.stringify({ code, subtotal }),
  });
  const data = await res.json();
  assert.ok(res.ok, data.message);
  await store.syncCouponToServer(code);
  const { couponRuleFromResponse } = require(path.join(frontendRoot, 'lib', 'pricing.ts'));
  const rule = couponRuleFromResponse(data);
  localStorage.setItem(COUPON_KEY, JSON.stringify({ code, discount: 0, rule }));
  cart.getState().applyCoupon(code);
  return rule;
}

// Mirrors what Cart drawer / checkout render from the store + stored rule.
function displayedPricing() {
  const { couponCode, items } = cart.getState();
  const stored = JSON.parse(localStorage.getItem(COUPON_KEY) || 'null');
  const token = localStorage.getItem('ardenby_token');
  const rule = token && couponCode && stored?.code === couponCode ? stored.rule : null;
  return calculateCartPricing(items, rule);
}

test.beforeEach(() => {
  for (const k of Object.keys(db)) db[k].length = 0;
  seedCatalog(db);
  localStorage.clear();
  sessionStorage.clear();
  toasts.length = 0;
  notices.length = 0;
  cart.setState({ items: [], couponCode: null, isOpen: false });
  cart.getState().switchToGuest();
});

// ------------------------------------------------------------------ stock ----
test('guest and logged-in carts enforce identical variant stock limits', async () => {
  const outcomes = { guest: [], user: [] };

  for (const variant of [OXFORD_M, OXFORD_L, TEE]) {
    const inventory = db.variants.find((v) => v.id === variant.variantId).inventory;
    const attempts = inventory + 1;

    // guest
    cart.setState({ items: [], couponCode: null });
    localStorage.clear();
    for (let n = 0; n < attempts; n++) outcomes.guest.push(await cart.getState().addItem(variant));
    assert.equal(lineQty(variant.variantId), inventory, 'guest quantity stops at stock');

    // logged in (fresh account per variant). The guest bag is emptied first so this
    // test isolates the stock rule; the login merge has its own tests below.
    const id = `u-${variant.variantId}`;
    localStorage.clear();
    cart.setState({ items: [], couponCode: null });
    await loginAndLoad(id);
    for (let n = 0; n < attempts; n++) outcomes.user.push(await cart.getState().addItem(variant));
    assert.equal(lineQty(variant.variantId), inventory, 'user quantity stops at stock');
    logout();
  }

  assert.deepEqual(outcomes.guest, outcomes.user, 'same accept/reject sequence for both');
  assert.ok(outcomes.guest.includes(false), 'at least one add was rejected');
  assert.ok(toasts.every((m) => m === 'Insufficient variant inventory.'));
});

test('stock limits are per variant, not per product', async () => {
  assert.equal(await cart.getState().addItem(OXFORD_L), true); // L has 1
  assert.equal(await cart.getState().addItem(OXFORD_L), false);
  assert.equal(await cart.getState().addItem(OXFORD_M), true); // M still has room
  assert.equal(lineQty('v2'), 1);
  assert.equal(lineQty('v1'), 1);
});

test('updateQuantity: guest and user get the same error and rollback behaviour', async () => {
  const inventory = db.variants.find((v) => v.id === 'v1').inventory;
  const results = {};

  for (const mode of ['guest', 'user']) {
    cart.setState({ items: [], couponCode: null });
    localStorage.clear();
    if (mode === 'user') await loginAndLoad('upd-user');
    await cart.getState().addItem(OXFORD_M);

    await cart.getState().updateQuantity('p1', 'M', 'Black', inventory); // allowed
    assert.equal(lineQty('v1'), inventory);

    let message = null;
    try {
      await cart.getState().updateQuantity('p1', 'M', 'Black', inventory + 1);
    } catch (error) {
      message = error.message;
    }
    results[mode] = { message, qty: lineQty('v1') };

    await cart.getState().updateQuantity('p1', 'M', 'Black', 1); // decrease is always allowed
    assert.equal(lineQty('v1'), 1);
    if (mode === 'user') logout();
  }

  assert.equal(results.guest.message, 'Insufficient variant inventory.');
  assert.deepEqual(results.guest, results.user);
  assert.equal(results.user.qty, inventory, 'rejected increase leaves the last valid quantity');
});

// ---------------------------------------------------------- guest cart + login ----
test('guest bag is merged into the account at sign-in (once); account items never leak to guests', async () => {
  await cart.getState().addItem(TEE);
  await cart.getState().addItem(OXFORD_M);

  await loginAndLoad('alice');
  const lines = () =>
    cart.getState().items.map((i) => [i.variantId, i.quantity]).sort((a, b) => a[0].localeCompare(b[0]));
  assert.deepEqual(lines(), [['v1', 1], ['v3', 1]], 'guest items now live in the account cart');
  assert.deepEqual(guestStored(), [], 'guest storage is emptied after the merge');

  // Loading the cart again must not merge (and double) anything.
  await cart.getState().loadUserCart();
  assert.deepEqual(lines(), [['v1', 1], ['v3', 1]]);

  await cart.getState().addItem(OXFORD_L);
  logout();
  assert.deepEqual(cart.getState().items, [], 'after logout the guest bag is empty: account items do not leak');
});

test('login merge respects variant stock and keeps what fits', async () => {
  // L has stock 1; a guest bag asking for 5 of it cannot be merged, the tee can.
  localStorage.setItem(
    GUEST_KEY,
    JSON.stringify([
      { ...OXFORD_L, quantity: 5 },
      { ...TEE, quantity: 2 },
    ])
  );
  cart.getState().switchToGuest();

  await loginAndLoad('bob');
  assert.equal(lineQty('v2'), undefined, 'over-stock line is not merged');
  assert.equal(lineQty('v3'), 2, 'valid line is merged');
  assert.deepEqual(guestStored(), [], 'rejected lines are not retried forever');
  assert.equal(notices.length, 1, 'the customer is told one item could not be added');
});

test('merge adds to an existing account line without exceeding stock', async () => {
  await loginAndLoad('carol');
  await cart.getState().addItem(OXFORD_M, 2); // M has 3 in stock
  logout();

  await cart.getState().addItem(OXFORD_M, 2); // guest wants 2 more: 2 + 2 > 3
  await loginAndLoad('carol');
  assert.equal(lineQty('v1'), 2, 'account keeps its valid quantity; the excess is refused');
});

// ------------------------------------------------------------------ coupons ----
test('coupon applied by a user is never inherited by the guest cart after logout', async () => {
  await loginAndLoad('alice');
  await cart.getState().addItem(OXFORD_M, 2);
  await cart.getState().addItem(TEE, 1);
  await applyCouponLikeDrawer('SAVE10');

  const withCoupon = displayedPricing();
  assert.ok(withCoupon.discount > 0, 'user sees a discount');
  assert.equal(cart.getState().couponCode, 'SAVE10');

  // Guest items that existed before login are kept
  localStorage.setItem(GUEST_KEY, JSON.stringify([{ ...TEE, quantity: 2 }]));

  logout();

  assert.equal(cart.getState().couponCode, null);
  assert.equal(localStorage.getItem(COUPON_KEY), null, 'stored coupon wiped on logout');
  const guest = displayedPricing();
  assert.equal(guest.discount, 0);
  assert.equal(guest.totalSavings, guest.productSavings, 'guest savings carry no coupon discount');
  assert.deepEqual(cart.getState().items.map((i) => [i.variantId, i.quantity]), [['v3', 2]]);

  // Even if a stale coupon is written back, the guest state ignores it.
  localStorage.setItem(COUPON_KEY, JSON.stringify({ code: 'SAVE10', discount: 100 }));
  cart.getState().applyCoupon('SAVE10');
  assert.equal(cart.getState().couponCode, null, 'guest cannot hold a coupon');
  cart.getState().loadGuestCart();
  assert.equal(localStorage.getItem(COUPON_KEY), null, 'stale coupon purged for guests');
});

test('coupon persists with the account across logout/login and is restored from the server', async () => {
  await loginAndLoad('alice');
  await cart.getState().addItem(OXFORD_M, 2);
  await applyCouponLikeDrawer('SAVE10');
  const before = displayedPricing();

  logout();
  assert.equal(displayedPricing().discount, 0);

  await loginAndLoad('alice');
  assert.equal(cart.getState().couponCode, 'SAVE10');
  assert.equal(JSON.parse(localStorage.getItem(COUPON_KEY)).code, 'SAVE10');
  const after = displayedPricing();
  assert.deepEqual(after, before, 'identical totals after re-login');
});

test('switching accounts never carries items, coupon or cached item ids across', async () => {
  await loginAndLoad('alice');
  await cart.getState().addItem(OXFORD_M, 2);
  await applyCouponLikeDrawer('FLAT200');
  logout();

  await loginAndLoad('bob');
  assert.deepEqual(cart.getState().items, []);
  assert.equal(cart.getState().couponCode, null);
  assert.equal(localStorage.getItem(COUPON_KEY), null);

  // Same variant as Alice's line: Bob's update must hit Bob's row, not Alice's cached id.
  await cart.getState().addItem(OXFORD_M, 1);
  await cart.getState().updateQuantity('p1', 'M', 'Black', 3);
  const alice = db.cart_items.find((i) => db.carts.find((c) => c.id === i.cart_id).user_id === 'alice');
  const bob = db.cart_items.find((i) => db.carts.find((c) => c.id === i.cart_id).user_id === 'bob');
  assert.equal(alice.quantity, 2, "Alice's row untouched");
  assert.equal(bob.quantity, 3);
  assert.equal(db.carts.find((c) => c.user_id === 'bob').coupon_code, null);
  assert.equal(db.carts.find((c) => c.user_id === 'alice').coupon_code, 'FLAT200');
});

test('a server response that arrives after logout cannot repopulate the guest cart', async () => {
  login('alice');
  await cart.getState().addItem(OXFORD_M, 2);
  const pending = cart.getState().loadUserCart();
  logout(); // user logs out while the cart request is in flight
  await pending;
  assert.equal(cart.getState().items.some((i) => i.variantId === 'v1'), false);
  assert.equal(cart.getState().couponCode, null);
});

test('clearing the cart (after an order) clears the coupon locally and on the server', async () => {
  await loginAndLoad('alice');
  await cart.getState().addItem(OXFORD_M, 2);
  await applyCouponLikeDrawer('SAVE10');
  cart.getState().clearCart();
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(cart.getState().couponCode, null);
  assert.equal(localStorage.getItem(COUPON_KEY), null);
  assert.equal(db.carts[0].coupon_code, null);
  assert.equal(db.cart_items.length, 0);
});

// ------------------------------------------------------------------ totals ----
test('checkout totals: UI pricing == server order pricing, with no double counting', async () => {
  const scenarios = [
    { lines: [[OXFORD_M, 1]], code: 'SAVE10' },
    { lines: [[OXFORD_M, 2], [TEE, 3]], code: 'SAVE10' },
    { lines: [[OXFORD_M, 2], [TEE, 3]], code: 'FLAT200' },
    { lines: [[TEE, 2]], code: null },
    { lines: [[TEE, 1]], code: null },
  ];

  for (const [index, { lines, code }] of scenarios.entries()) {
    const id = `totals-${index}`;
    await loginAndLoad(id);
    for (const [variant, qty] of lines) await cart.getState().addItem(variant, qty);
    if (code) await applyCouponLikeDrawer(code);

    const ui = displayedPricing();

    // Independent expectation from the seeded rows.
    const subtotal = lines.reduce((s, [v, q]) => s + v.price * q, 0);
    const mrpTotal = lines.reduce((s, [v, q]) => s + v.mrp * q, 0);
    const coupon = db.coupons.find((c) => c.code === code);
    const discount = !coupon ? 0 : Math.min(
      coupon.discount_type === 'percentage'
        ? Math.min((subtotal * coupon.discount_value) / 100, coupon.max_discount ?? Infinity)
        : coupon.discount_value,
      subtotal);
    const shipping = subtotal >= 999 ? 0 : 79;
    const gst = Math.round((subtotal - discount) * 0.05);

    assert.equal(ui.subtotal, subtotal);
    assert.equal(ui.discount, discount);
    assert.equal(ui.shipping, shipping);
    assert.equal(ui.gst, gst, 'GST charged once, on the discounted amount');
    assert.equal(ui.total, subtotal - discount + shipping + gst);
    assert.equal(ui.productSavings, mrpTotal - subtotal);
    assert.equal(ui.totalSavings, mrpTotal - subtotal + discount, 'savings = MRP gap + coupon, once');

    // What the backend would charge for this exact cart + saved coupon.
    const serverCart = db.carts.find((c) => c.user_id === id);
    const server = calculateOrderTotals(
      subtotal,
      serverCart.coupon_code ? ui.discount : 0
    );
    assert.equal(serverCart.coupon_code, code, 'server cart holds the coupon the UI shows');
    assert.equal(server.totalAmount, ui.total, 'UI total == order total');
    assert.equal(server.taxAmount, ui.gst);
    logout();
  }
});

test.after(() => {
  console.error = originalError;
});
