import { create } from 'zustand';

import { toast } from 'sonner';

import type { CartItem, ProductColor, ProductSize } from '@/types';
import { apiUrl } from '@/lib/api-url';
import { couponRuleFromResponse } from '@/lib/pricing';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  couponCode: string | null;

  /** Resolves true when the item was added; false when stock/auth rules rejected it. */
  addItem: (
    item: Omit<CartItem, 'quantity'>,
    quantity?: number
  ) => Promise<boolean>;
  removeItem: (productId: string, size: ProductSize, color: ProductColor) => void;
  updateQuantity: (
    productId: string,
    size: ProductSize,
    color: ProductColor,
    quantity: number
  ) => Promise<void>;

  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
  loadUserCart: () => Promise<void>;
  loadGuestCart: () => void;
  /** Logout / no-token state: guest items only, never a coupon. */
  switchToGuest: () => void;
}

const GUEST_CART_KEY = 'ardenby-cart-guest';

// Shared with CartDrawer and checkout: the applied coupon of the signed-in user.
export const COUPON_STORAGE_KEY = 'kovenik_applied_coupon';
export const COUPON_CHANGE_EVENT = 'kovenik:coupon-change';

const STOCK_ERROR_MESSAGE = 'Insufficient variant inventory.';

class CartApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function clearStoredCoupon(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(COUPON_STORAGE_KEY);
    window.dispatchEvent(new Event(COUPON_CHANGE_EVENT));
  } catch {
    // Ignore localStorage failures.
  }
}

function writeStoredCouponRule(value: {
  code: string;
  discount: number;
  rule?: unknown;
}): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(value));
    window.dispatchEvent(new Event(COUPON_CHANGE_EVENT));
  } catch {
    // Ignore localStorage failures.
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ardenby_token');
}

function getCartItemKey(
  productId: string,
  size: ProductSize,
  color: ProductColor
): string {
  return `${productId}-${size}-${color}`;
}
const serverCartItemIds = new Map<string, string>();
// Serialize quantity updates per product variant to prevent overlapping PUT requests.
const quantityUpdateQueues = new Map<string, Promise<void>>();

export async function waitForPendingCartUpdates() {
  await Promise.all(
    Array.from(quantityUpdateQueues.values()).map((promise) =>
      promise.catch(() => undefined)
    )
  );
}

const quantityUpdateVersions = new Map<string, number>();
const confirmedQuantities = new Map<string, number>();

// Per-account caches must never survive a logout or an account switch.
let activeCartToken: string | null = null;

function resetAccountCaches(): void {
  serverCartItemIds.clear();
  quantityUpdateQueues.clear();
  quantityUpdateVersions.clear();
  confirmedQuantities.clear();
}

// Guest stock checks are serialized so rapid clicks cannot oversell a variant.
let guestStockQueue: Promise<unknown> = Promise.resolve();

function runGuestStockTask<T>(task: () => Promise<T>): Promise<T> {
  const next = guestStockQueue.then(task, task);
  guestStockQueue = next.catch(() => undefined);
  return next;
}

// Same variant-level rule the server applies to signed-in carts, exposed to guests.
async function assertGuestVariantStock(
  productId: string,
  variantId: string | undefined,
  totalQuantity: number
): Promise<void> {
  if (!variantId) return;

  let response: Response;
  try {
    response = await fetch(apiUrl('/api/cart/stock-check'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          {
            product_id: productId,
            variant_id: variantId,
            quantity: totalQuantity,
          },
        ],
      }),
    });
  } catch {
    // Offline: the order API re-validates stock, so don't block browsing.
    return;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || 'Unable to verify stock.');
  }

  if (data?.ok === false) {
    throw new Error(STOCK_ERROR_MESSAGE);
  }
}

function readGuestCart(): CartItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeGuestCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {
    // Ignore localStorage failures.
  }
}

function clearGuestCartStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    // Ignore localStorage failures.
  }
}

async function cartApiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  if (!token) throw new Error('AUTH_REQUIRED');

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(apiUrl(endpoint), {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new CartApiError(
      data?.message || data?.error || 'Unable to update cart.',
      response.status
    );
  }

  return data as T;
}

// Persists (or clears, with null) the signed-in user's coupon on their server
// cart so the order is priced from the same coupon the UI shows.
export async function syncCouponToServer(code: string | null): Promise<void> {
  await cartApiRequest('/api/cart/coupon', {
    method: 'PATCH',
    body: JSON.stringify({ coupon_code: code }),
  });
}

// Rebuilds the local coupon state from the account's server cart. The server
// is the source of truth, so a coupon can never leak between accounts.
async function restoreCouponFromServer(
  rawCode: unknown,
  items: CartItem[],
  token: string
): Promise<void> {
  const code = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : '';

  if (!code || items.length === 0) {
    clearStoredCoupon();
    useCartStore.setState({ couponCode: null });
    return;
  }

  try {
    const data = await cartApiRequest('/api/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal: getCartSubtotal(items) }),
    });

    if (getToken() !== token) return;

    const rule = couponRuleFromResponse(data);
    const legacyDiscount = Number(data?.discount);

    writeStoredCouponRule({
      code,
      discount: rule || !Number.isFinite(legacyDiscount) ? 0 : legacyDiscount,
      rule: rule ?? undefined,
    });
    useCartStore.setState({ couponCode: code });
  } catch (error) {
    if (getToken() !== token) return;

    if (error instanceof CartApiError && error.status < 500 && error.status !== 401) {
      // The coupon no longer applies: drop it everywhere.
      clearStoredCoupon();
      useCartStore.setState({ couponCode: null });
      void syncCouponToServer(null).catch(() => undefined);
      return;
    }

    // Network/server trouble: keep the code, the drawer re-validates later.
    writeStoredCouponRule({ code, discount: 0 });
    useCartStore.setState({ couponCode: code });
  }
}

function extractCartItems(response: any): any[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.cart?.items)) return response.cart.items;
  if (Array.isArray(response?.data?.cart?.items)) {
    return response.data.cart.items;
  }
  return [];
}

function normalizeServerCartItem(serverItem: any): CartItem | null {
  const productId = serverItem?.product_id ?? serverItem?.productId;
  const variantId = serverItem?.variant_id ?? serverItem?.variantId;
  const size = serverItem?.size;
  const color = serverItem?.color;
  const quantity = Number(serverItem?.quantity ?? 0);

  if (!productId || !variantId || !size || !color || quantity < 1) {
    return null;
  }

  const productName =
    serverItem?.product_name_snapshot ??
    serverItem?.product_name ??
    serverItem?.name ??
    serverItem?.product?.name ??
    'Product';

  const productImage =
    serverItem?.image_snapshot ??
    serverItem?.product_image ??
    serverItem?.image ??
    serverItem?.product?.image ??
    '';

  const productPrice = Number(
    serverItem?.price_snapshot ??
      serverItem?.price ??
      serverItem?.unit_price ??
      0
  );

  const productMrp = Number(
    serverItem?.mrp_snapshot ??
      serverItem?.mrp ??
      serverItem?.original_price ??
      productPrice
  );
const serverItemId =
  serverItem?.id ??
  serverItem?.cart_item_id ??
  serverItem?.cartItemId;

if (serverItemId) {
  serverCartItemIds.set(
    getCartItemKey(
      String(productId),
      size as ProductSize,
      color as ProductColor
    ),
    String(serverItemId)
  );
}
  return {
    productId: String(productId),
    variantId: String(variantId),
    slug: String(
      serverItem?.slug ??
        serverItem?.product_slug ??
        serverItem?.product?.slug ??
        ''
    ),
    name: String(productName),
    image: String(productImage),
    size: size as ProductSize,
    color: color as ProductColor,
    quantity,
    price: productPrice,
    mrp: productMrp,
  };
}

async function fetchServerCart(): Promise<{
  items: CartItem[];
  couponCode: unknown;
}> {
  const response = await cartApiRequest('/api/cart', { method: 'GET' });

  return {
    items: extractCartItems(response)
      .map(normalizeServerCartItem)
      .filter((item): item is CartItem => item !== null),
    couponCode:
      response?.cart?.coupon_code ??
      response?.data?.cart?.coupon_code ??
      response?.coupon_code ??
      response?.couponCode ??
      null,
  };
}

let guestMergeInFlight: Promise<void> | null = null;

// Moves what a visitor put in their guest cart into the account's server cart at
// sign-in. The server enforces variant stock; the guest copy is cleared first so
// the same lines can never be merged twice (second tab, repeated effect).
async function mergeGuestCartIntoAccount(token: string): Promise<void> {
  if (guestMergeInFlight) return guestMergeInFlight;

  const guestItems = readGuestCart().filter((item) => item?.variantId);
  if (guestItems.length === 0) return;

  guestMergeInFlight = (async () => {
    clearGuestCartStorage();

    const retry: CartItem[] = [];
    let rejected = 0;

    for (const item of guestItems) {
      if (getToken() !== token) {
        retry.push(item);
        continue;
      }

      try {
        await cartApiRequest('/api/cart/items', {
          method: 'POST',
          body: JSON.stringify({
            product_id: item.productId,
            variant_id: item.variantId,
            quantity: item.quantity,
          }),
        });
      } catch (error) {
        const notAllowed =
          error instanceof CartApiError &&
          (error.status === 401 || error.status === 403);

        if (error instanceof CartApiError && error.status < 500 && !notAllowed) {
          // Out of stock / unavailable: not retryable.
          rejected += 1;
        } else {
          // Network/server trouble, or an account that has no cart (e.g. admin):
          // keep the bag for a later sign-in.
          retry.push(item);
        }
      }
    }

    if (retry.length > 0) writeGuestCart(retry);

    if (rejected > 0) {
      toast.message(
        rejected === 1
          ? 'One item from your guest bag could not be added because of limited stock.'
          : `${rejected} items from your guest bag could not be added because of limited stock.`
      );
    }
  })().finally(() => {
    guestMergeInFlight = null;
  });

  return guestMergeInFlight;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: readGuestCart(),
  isOpen: false,
  couponCode: null,

  addItem: async (item, quantity = 1) => {
    const token = getToken();

    if (!token) {
      return runGuestStockTask(async () => {
        const isSameLine = (i: CartItem) =>
          i.productId === item.productId &&
          i.size === item.size &&
          i.color === item.color;

        const existing = get().items.find(isSameLine);

        try {
          await assertGuestVariantStock(
            item.productId,
            item.variantId,
            (existing?.quantity ?? 0) + quantity
          );
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : 'Unable to add item.'
          );
          return false;
        }

        // Guests never hold a coupon, whatever was left in storage.
        const nextItems = get().items.find(isSameLine)
          ? get().items.map((i) =>
              isSameLine(i) ? { ...i, quantity: i.quantity + quantity } : i
            )
          : [...get().items, { ...item, quantity }];

        writeGuestCart(nextItems);
        set({ items: nextItems, couponCode: null });
        return true;
      });
    }

    if (!item.variantId) return false;

    try {
      await cartApiRequest('/api/cart/items', {
        method: 'POST',
        body: JSON.stringify({
          product_id: item.productId,
          variant_id: item.variantId,
          quantity,
        }),
      });

      const { items: serverItems } = await fetchServerCart();
      if (getToken() !== token) return false;

      set({ items: serverItems });
      return true;
    } catch (error) {
      console.error('Failed to add cart item:', error);
      toast.error(
        error instanceof Error ? error.message : 'Unable to add item.'
      );
      return false;
    }
  },

  removeItem: (productId, size, color) => {
    const token = getToken();
    const currentItem = get().items.find(
      (item) =>
        item.productId === productId &&
        item.size === size &&
        item.color === color
    );

    const nextItems = get().items.filter(
      (item) =>
        !(
          item.productId === productId &&
          item.size === size &&
          item.color === color
        )
    );

    set({ items: nextItems });

    if (!token) {
      writeGuestCart(nextItems);
      return;
    }

    if (!currentItem) return;

    void (async () => {
      try {
        const response = await cartApiRequest('/api/cart', {
          method: 'GET',
        });
        const serverItems = extractCartItems(response);

        const serverItem = serverItems.find(
          (item: any) =>
            String(item?.product_id ?? item?.productId) === String(productId) &&
            String(item?.variant_id ?? item?.variantId) ===
              String(currentItem.variantId)
        );

        const serverItemId =
          serverItem?.id ??
          serverItem?.cart_item_id ??
          serverItem?.cartItemId;

        if (serverItemId) {
          await cartApiRequest(`/api/cart/items/${serverItemId}`, {
            method: 'DELETE',
          });
        }

        // Keep the optimistic local state; a stale GET must not overwrite it.
      } catch (error) {
        console.error('Failed to remove cart item:', error);
      }
    })();
  },

  updateQuantity: async (productId, size, color, quantity) => {
    const nextQuantity = Math.max(1, Math.floor(quantity));
    const token = getToken();
    const queueKey = getCartItemKey(productId, size, color);
    const previousItem = get().items.find(
      (item) =>
        item.productId === productId &&
        item.size === size &&
        item.color === color
    );

    if (!previousItem) return;

    if (!token) {
      await runGuestStockTask(async () => {
        // Only increases can exceed stock; the server rule is the same one
        // signed-in carts hit on PUT /api/cart/items/:id.
        if (nextQuantity > previousItem.quantity) {
          await assertGuestVariantStock(
            productId,
            previousItem.variantId,
            nextQuantity
          );
        }

        const nextItems = get().items.map((item) =>
          item.productId === productId &&
          item.size === size &&
          item.color === color
            ? { ...item, quantity: nextQuantity }
            : item
        );
        set({ items: nextItems });
        writeGuestCart(nextItems);
      });
      return;
    }

    if (!previousItem.variantId) {
      throw new Error('This cart item is missing its product variant.');
    }

    if (!confirmedQuantities.has(queueKey)) {
      confirmedQuantities.set(queueKey, previousItem.quantity);
    }

    const version = (quantityUpdateVersions.get(queueKey) ?? 0) + 1;
    quantityUpdateVersions.set(queueKey, version);

    // Optimistically update the UI while the server validates stock.
    set({
      items: get().items.map((item) =>
        item.productId === productId &&
        item.size === size &&
        item.color === color
          ? { ...item, quantity: nextQuantity }
          : item
      ),
    });

    const previousUpdate =
      quantityUpdateQueues.get(queueKey) ?? Promise.resolve();

      

    const updatePromise: Promise<void> = previousUpdate
      .catch(() => undefined)

.then(async () => {
  let serverItemId = serverCartItemIds.get(queueKey);

  // Fallback: ID cache mein nahi hai toh ek baar cart fetch karo.
  if (!serverItemId) {
    const response = await cartApiRequest('/api/cart', {
      method: 'GET',
    });

    const serverItem = extractCartItems(response).find(
      (item: any) =>
        String(item?.product_id ?? item?.productId) ===
          String(productId) &&
        String(item?.variant_id ?? item?.variantId) ===
          String(previousItem.variantId)
    );

    const foundId =
      serverItem?.id ??
      serverItem?.cart_item_id ??
      serverItem?.cartItemId;

    if (!foundId) {
      throw new Error('Cart item ID not found.');
    }

    serverItemId = String(foundId);
    serverCartItemIds.set(queueKey, serverItemId);
  }

  // Backend stock validation remains enabled.
  await cartApiRequest(`/api/cart/items/${serverItemId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity: nextQuantity }),
  });

  confirmedQuantities.set(queueKey, nextQuantity);
});

    try {
      await updatePromise;
    } catch (error) {
      // Roll back only if this is still the latest click for this variant.
      if (quantityUpdateVersions.get(queueKey) === version) {
        const rollbackQuantity =
          confirmedQuantities.get(queueKey) ?? previousItem.quantity;

        set({
          items: get().items.map((item) =>
            item.productId === productId &&
            item.size === size &&
            item.color === color
              ? { ...item, quantity: rollbackQuantity }
              : item
          ),
        });
      }

      throw error;
    } finally {
      if (quantityUpdateQueues.get(queueKey) === updatePromise) {
        quantityUpdateQueues.delete(queueKey);
      }
    }
  },

  clearCart: () => {
    const token = getToken();

    set({ items: [], couponCode: null });

    // A cleared cart (e.g. after placing an order) must not leak its coupon into the next one.
    clearStoredCoupon();

    if (!token) {
      clearGuestCartStorage();
      return;
    }

    void (async () => {
      try {
        await cartApiRequest('/api/cart', { method: 'DELETE' });
      } catch (error) {
        console.error('Failed to clear server cart:', error);
      }
    })();
  },

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

  // A guest cart can never hold a coupon.
  applyCoupon: (code) => {
    if (!getToken()) return;
    set({ couponCode: code });
  },
  removeCoupon: () => set({ couponCode: null }),

  loadUserCart: async () => {
    const token = getToken();
    if (!token) return;

    // New account (or first load): drop every cache that belongs to the old one.
    if (activeCartToken !== token) {
      resetAccountCaches();
      activeCartToken = token;
    }

    try {
      await mergeGuestCartIntoAccount(token);

      const { items: serverItems, couponCode } = await fetchServerCart();

      // Logged out / switched account while the request was in flight.
      if (getToken() !== token) return;

      set({ items: serverItems });
      await restoreCouponFromServer(couponCode, serverItems, token);
    } catch (error) {
      console.error('Failed to load user cart:', error);
    }
  },

  loadGuestCart: () => {
    if (getToken()) return;
    get().switchToGuest();
    set({ isOpen: false });
  },

  switchToGuest: () => {
    activeCartToken = null;
    resetAccountCaches();
    clearStoredCoupon();
    set({ items: readGuestCart(), couponCode: null });
  },
}));

export function getCartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getCartSavings(items: CartItem[]): number {
  return items.reduce(
    (sum, item) => sum + (item.mrp - item.price) * item.quantity,
    0
  );
}

export function getCartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

if (typeof window !== 'undefined') {
  useCartStore.subscribe((state) => {
    if (state.items.some((item) => item.name === 'Product')) {
      console.trace('ITEMS WITH NAME "Product" SET HERE:', state.items);
    }
  });
}
