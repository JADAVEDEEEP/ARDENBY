import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, ProductColor, ProductSize } from '@/types';
import { apiUrl } from '@/lib/api-url';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  couponCode: string | null;

  addItem: (
    item: Omit<CartItem, 'quantity'>,
    quantity?: number
  ) => void;

  removeItem: (
    productId: string,
    size: ProductSize,
    color: ProductColor
  ) => void;

  updateQuantity: (
    productId: string,
    size: ProductSize,
    color: ProductColor,
    quantity: number
  ) => void;

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
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem('ardenby_token');
}

function getCartItemKey(
  productId: string,
  size: ProductSize,
  color: ProductColor
): string {
  return `${productId}-${size}-${color}`;
}

function readGuestCart(): CartItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeGuestCart(items: CartItem[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {
    // Ignore localStorage failures.
  }
}

function clearGuestCartStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }

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

  if (!token) {
    throw new Error('AUTH_REQUIRED');
  }

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
      data?.message ||
        data?.error ||
        'Unable to update cart.'
    );
  }

  return data as T;
}

function extractCartItems(response: any): any[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  if (Array.isArray(response?.data?.items)) {
    return response.data.items;
  }

  if (Array.isArray(response?.cart?.items)) {
    return response.cart.items;
  }

  if (Array.isArray(response?.data?.cart?.items)) {
    return response.data.cart.items;
  }

  return [];
}

function normalizeServerCartItem(
  serverItem: any
): CartItem | null {
  const productId =
    serverItem?.product_id ||
    serverItem?.productId;

  const variantId =
    serverItem?.variant_id ||
    serverItem?.variantId;

  const size = serverItem?.size;
  const color = serverItem?.color;

  const quantity = Number(
    serverItem?.quantity || 0
  );

  if (
    !productId ||
    !variantId ||
    !size ||
    !color ||
    quantity < 1
  ) {
    return null;
  }

  return {
    productId: String(productId),
    variantId: String(variantId),
    slug: String(
      serverItem?.slug ||
        serverItem?.product_slug ||
        ''
    ),
    name: String(
  serverItem?.name ||
    serverItem?.product_name ||
    serverItem?.product_name_snapshot ||
    'Product'
),

image: String(
  serverItem?.image ||
    serverItem?.product_image ||
    serverItem?.image_snapshot ||
    ''
),
    size: size as ProductSize,
    color: color as ProductColor,
    quantity,
   price: Number(
  serverItem?.price ??
    serverItem?.price_snapshot ??
    0
),

mrp: Number(
  serverItem?.mrp ??
    serverItem?.mrp_snapshot ??
    serverItem?.price ??
    serverItem?.price_snapshot ??
    0
),
  };
}

async function fetchServerCart(): Promise<CartItem[]> {
  const response = await cartApiRequest('/api/cart', {
    method: 'GET',
  });

  return extractCartItems(response)
    .map(normalizeServerCartItem)
    .filter(
      (item): item is CartItem => item !== null
    );
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // Initial browser state is the guest cart.
      // If a user is already logged in, loadUserCart()
      // replaces this with the server cart.
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
                    ? {
                        ...i,
                        quantity: i.quantity + quantity,
                      }
                    : i
                )
              : [
                  ...state.items,
                  {
                    ...item,
                    quantity,
                  },
                ];

            writeGuestCart(nextItems);

            return {
              items: nextItems,
              isOpen: true,
            };
          });

          return;
        }

        // Authenticated carts live only on the backend.
        set((state) => {
          const existing = state.items.find(
            (i) =>
              i.productId === item.productId &&
              i.size === item.size &&
              i.color === item.color
          );

          return existing
            ? {
                items: state.items.map((i) =>
                  i.productId === item.productId &&
                  i.size === item.size &&
                  i.color === item.color
                    ? {
                        ...i,
                        quantity: i.quantity + quantity,
                      }
                    : i
                ),
                isOpen: true,
              }
            : {
                items: [
                  ...state.items,
                  {
                    ...item,
                    quantity,
                  },
                ],
                isOpen: true,
              };
        });

        if (item.variantId) {
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

              set({
                items: serverItems,
              });
            } catch {
              // Keep the optimistic cart state if API request fails.
            }
          })();
        }
      },

      removeItem: (
        productId,
        size,
        color
      ) => {
        const token = getToken();

        const currentItem = get().items.find(
          (item) =>
            item.productId === productId &&
            item.size === size &&
            item.color === color
        );

        const nextItems = get().items.filter(
          (i) =>
            !(
              i.productId === productId &&
              i.size === size &&
              i.color === color
            )
        );

        set({
          items: nextItems,
        });

        if (!token) {
          writeGuestCart(nextItems);
          return;
        }

        if (!currentItem) {
          return;
        }

        void (async () => {
          try {
            const response =
              await cartApiRequest('/api/cart', {
                method: 'GET',
              });

            const serverItems =
              extractCartItems(response);

            const serverItem =
              serverItems.find(
                (serverItem: any) =>
                  String(
                    serverItem?.product_id ||
                      serverItem?.productId
                  ) === productId &&
                  String(
                    serverItem?.variant_id ||
                      serverItem?.variantId
                  ) === currentItem.variantId
              );

            const serverItemId =
              serverItem?.id ||
              serverItem?.cart_item_id ||
              serverItem?.cartItemId;

            if (serverItemId) {
              await cartApiRequest(
                `/api/cart/items/${serverItemId}`,
                {
                  method: 'DELETE',
                }
              );
            }

            const updatedItems =
              await fetchServerCart();

            set({
              items: updatedItems,
            });
          } catch {
            // Keep local state if backend fails.
          }
        })();
      },

      updateQuantity: (
        productId,
        size,
        color,
        quantity
      ) => {
        const nextQuantity = Math.max(
          1,
          quantity
        );

        const token = getToken();

        const nextItems = get().items.map((i) =>
          i.productId === productId &&
          i.size === size &&
          i.color === color
            ? {
                ...i,
                quantity: nextQuantity,
              }
            : i
        );

        set({
          items: nextItems,
        });

        if (!token) {
          writeGuestCart(nextItems);
          return;
        }

        const currentItem = get().items.find(
          (item) =>
            item.productId === productId &&
            item.size === size &&
            item.color === color
        );

        if (!currentItem?.variantId) {
          return;
        }

        void (async () => {
          try {
            const response =
              await cartApiRequest('/api/cart', {
                method: 'GET',
              });

            const serverItems =
              extractCartItems(response);

            const serverItem =
              serverItems.find(
                (serverItem: any) =>
                  String(
                    serverItem?.product_id ||
                      serverItem?.productId
                  ) === productId &&
                  String(
                    serverItem?.variant_id ||
                      serverItem?.variantId
                  ) === currentItem.variantId
              );

            const serverItemId =
              serverItem?.id ||
              serverItem?.cart_item_id ||
              serverItem?.cartItemId;

            if (!serverItemId) {
              return;
            }

            await cartApiRequest(
              `/api/cart/items/${serverItemId}`,
              {
                method: 'PUT',
                body: JSON.stringify({
                  quantity: nextQuantity,
                }),
              }
            );

            const updatedItems =
              await fetchServerCart();

            set({
              items: updatedItems,
            });
          } catch {
            // Keep local state if backend fails.
          }
        })();
      },

      clearCart: () => {
        const token = getToken();

        set({
          items: [],
          couponCode: null,
        });

        if (!token) {
          clearGuestCartStorage();
          return;
        }

        void (async () => {
          try {
            await cartApiRequest('/api/cart', {
              method: 'DELETE',
            });
          } catch {
            // Local state remains cleared.
          }
        })();
      },

      openCart: () =>
        set({
          isOpen: true,
        }),

      closeCart: () =>
        set({
          isOpen: false,
        }),

      toggleCart: () =>
        set((state) => ({
          isOpen: !state.isOpen,
        })),

      applyCoupon: (code) =>
        set({
          couponCode: code,
        }),

      removeCoupon: () =>
        set({
          couponCode: null,
        }),

      loadUserCart: async () => {
        const token = getToken();

        if (!token) {
          return;
        }

        try {
          const serverItems =
            await fetchServerCart();

          set({
            items: serverItems,
          });
        } catch {
          // Keep current state if server cart cannot be loaded.
        }
      },

      loadGuestCart: () => {
        const token = getToken();

        if (token) {
          return;
        }

        set({
          items: readGuestCart(),
        });
      },
    }),

    {
      // Only persist UI state here.
      // Cart items are handled separately:
      // guest -> localStorage, logged-in -> backend.
      name: 'ardenby-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isOpen: state.isOpen,
        couponCode: state.couponCode,
      }),
    }
  )
);

export function getCartSubtotal(
  items: CartItem[]
): number {
  return items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );
}

export function getCartSavings(
  items: CartItem[]
): number {
  return items.reduce(
    (sum, i) =>
      sum + (i.mrp - i.price) * i.quantity,
    0
  );
}

export function getCartCount(
  items: CartItem[]
): number {
  return items.reduce(
    (sum, i) => sum + i.quantity,
    0
  );
}
