import { create } from 'zustand';

import type { CartItem, ProductColor, ProductSize } from '@/types';
import { apiUrl } from '@/lib/api-url';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  couponCode: string | null;

  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
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
}

const GUEST_CART_KEY = 'ardenby-cart-guest';

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

// Serialize quantity updates per product variant to prevent overlapping PUT requests.
const quantityUpdateQueues = new Map<string, Promise<void>>();
const quantityUpdateVersions = new Map<string, number>();
const confirmedQuantities = new Map<string, number>();

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
    throw new Error(
      data?.message || data?.error || 'Unable to update cart.'
    );
  }

  return data as T;
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

async function fetchServerCart(): Promise<CartItem[]> {
  const response = await cartApiRequest('/api/cart', { method: 'GET' });

  return extractCartItems(response)
    .map(normalizeServerCartItem)
    .filter((item): item is CartItem => item !== null);
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: readGuestCart(),
  isOpen: false,
  couponCode: null,

  addItem: (item, quantity = 1) => {
    const token = getToken();

    if (!token) {
      set((state) => {
        const existing = state.items.find(
          (i) =>
            i.productId === item.productId &&
            i.size === item.size &&
            i.color === item.color
        );

        const nextItems = existing
          ? state.items.map((i) =>
              i.productId === item.productId &&
              i.size === item.size &&
              i.color === item.color
                ? { ...i, quantity: i.quantity + quantity }
                : i
            )
          : [...state.items, { ...item, quantity }];

        writeGuestCart(nextItems);
        return { items: nextItems, isOpen: true };
      });
      return;
    }

    if (!item.variantId) return;

    void (async () => {
      try {
        await cartApiRequest('/api/cart/items', {
          method: 'POST',
          body: JSON.stringify({
            product_id: item.productId,
            variant_id: item.variantId,
            quantity,
          }),
        });

        const serverItems = await fetchServerCart();
        set({ items: serverItems, isOpen: true });
      } catch (error) {
        console.error('Failed to add cart item:', error);
      }
    })();
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
      const nextItems = get().items.map((item) =>
        item.productId === productId &&
        item.size === size &&
        item.color === color
          ? { ...item, quantity: nextQuantity }
          : item
      );
      set({ items: nextItems });
      writeGuestCart(nextItems);
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
        const response = await cartApiRequest('/api/cart', {
          method: 'GET',
        });

        const serverItems = extractCartItems(response);
        const serverItem = serverItems.find(
          (item: any) =>
            String(item?.product_id ?? item?.productId) === String(productId) &&
            String(item?.variant_id ?? item?.variantId) ===
              String(previousItem.variantId)
        );

        const serverItemId =
          serverItem?.id ??
          serverItem?.cart_item_id ??
          serverItem?.cartItemId;

        if (!serverItemId) {
          throw new Error('Cart item ID not found for quantity update.');
        }

        await cartApiRequest(`/api/cart/items/${serverItemId}`, {
          method: 'PUT',
          body: JSON.stringify({ quantity: nextQuantity }),
        });

        confirmedQuantities.set(queueKey, nextQuantity);
      });

    quantityUpdateQueues.set(queueKey, updatePromise);

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

  applyCoupon: (code) => set({ couponCode: code }),
  removeCoupon: () => set({ couponCode: null }),

  loadUserCart: async () => {
    if (!getToken()) return;

    try {
      const serverItems = await fetchServerCart();
      set({ items: serverItems });
    } catch (error) {
      console.error('Failed to load user cart:', error);
    }
  },

  loadGuestCart: () => {
    if (getToken()) return;
    set({
      items: readGuestCart(),
      isOpen: false,
      couponCode: null,
    });
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
