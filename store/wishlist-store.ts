import { create } from 'zustand';

import {
  persist,
  createJSONStorage,
} from 'zustand/middleware';

import { apiUrl } from '@/lib/api-url';

export interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  mrp: number;
}

interface WishlistState {
  items: WishlistItem[];

  /**
   * Load customer's wishlist from backend.
   */
  syncFromApi: () => Promise<void>;

  /**
   * Add/remove wishlist item through backend.
   */
  toggle: (item: WishlistItem) => Promise<void>;

  /**
   * Remove one item through backend.
   */
  remove: (productId: string) => Promise<void>;

  /**
   * Check local wishlist state.
   */
  has: (productId: string) => boolean;

  /**
   * Clear customer's wishlist through backend.
   */
  clear: () => Promise<void>;

  /**
   * Clear local state on logout.
   */
  clearLocal: () => void;
}

const getToken = () =>
  typeof window !== 'undefined'
    ? localStorage.getItem('ardenby_token')
    : null;

async function wishlistRequest<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  if (!token) {
    throw new Error('AUTH_REQUIRED');
  }

  const headers = new Headers(options.headers);

  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(apiUrl(path), {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        'Unable to update wishlist.',
    );
  }

  return data;
}

function unwrapWishlist(data: any): any[] {
  const value =
    data?.wishlist ??
    data?.items ??
    data?.data ??
    data;

  return Array.isArray(value) ? value : [];
}

function normalizeImageUrl(
  value: unknown,
): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function normalizeWishlistItem(
  item: any,
): WishlistItem {
  return {
    productId: String(
      item?.product_id ??
        item?.productId ??
        item?.id ??
        '',
    ),

    slug: String(
      item?.slug ??
        item?.product_slug ??
        item?.productSlug ??
        '',
    ),

    name:
      item?.product_name ??
      item?.productName ??
      item?.name ??
      'ARDENBY Product',

    /*
     * Backend wishlist API returns primary_image.
     * Keep fallbacks for compatibility with older data.
     */
    image: normalizeImageUrl(
      item?.primary_image ??
        item?.image_url ??
        item?.product_image ??
        item?.image ??
        '',
    ),

    price: Number(
      item?.price ??
        item?.product_price ??
        0,
    ),

    mrp: Number(
      item?.mrp ??
        item?.product_mrp ??
        item?.price ??
        0,
    ),
  };
}

function isValidWishlistItem(
  item: WishlistItem,
): boolean {
  return Boolean(
    item.productId &&
      item.name,
  );
}

export const useWishlistStore =
  create<WishlistState>()(
    persist(
      (set, get) => ({
        items: [],

        // =========================================================
        // SYNC FROM BACKEND
        // GET /api/wishlist
        // =========================================================

        syncFromApi: async () => {
          const token = getToken();

          if (!token) {
            set({ items: [] });
            return;
          }

          try {
            const response =
              await wishlistRequest(
                '/api/wishlist',
                {
                  method: 'GET',
                },
              );

            const wishlist =
              unwrapWishlist(response)
                .map(normalizeWishlistItem)
                .filter(isValidWishlistItem);

            /*
             * Backend is the source of truth.
             * Replace local persisted state completely.
             */
            set({
              items: wishlist,
            });
          } catch (error) {
            if (
              error instanceof Error &&
              error.message === 'AUTH_REQUIRED'
            ) {
              set({ items: [] });
              return;
            }

            console.error(
              'Wishlist sync failed:',
              error,
            );
          }
        },

        // =========================================================
        // TOGGLE
        // POST /api/wishlist
        // DELETE /api/wishlist/:productId
        // =========================================================

        toggle: async (item) => {
          const productId =
            String(item.productId).trim();

          if (!productId) {
            throw new Error(
              'Product ID is required.',
            );
          }

          const exists =
            get().has(productId);

          try {
            // =====================================================
            // REMOVE
            // =====================================================

            if (exists) {
              await wishlistRequest(
                `/api/wishlist/${encodeURIComponent(
                  productId,
                )}`,
                {
                  method: 'DELETE',
                },
              );

              set((state) => ({
                items: state.items.filter(
                  (wishlistItem) =>
                    wishlistItem.productId !==
                    productId,
                ),
              }));

              return;
            }

            // =====================================================
            // ADD
            // =====================================================

            await wishlistRequest(
              '/api/wishlist',
              {
                method: 'POST',
                body: JSON.stringify({
                  productId,
                }),
              },
            );

            set((state) => {
              const alreadyExists =
                state.items.some(
                  (wishlistItem) =>
                    wishlistItem.productId ===
                    productId,
                );

              if (alreadyExists) {
                return state;
              }

              return {
                items: [
                  ...state.items,
                  {
                    ...item,
                    productId,
                    image:
                      normalizeImageUrl(
                        item.image,
                      ),
                  },
                ],
              };
            });
          } catch (error) {
            console.error(
              'Wishlist toggle failed:',
              error,
            );

            throw error;
          }
        },

        // =========================================================
        // REMOVE ONE
        // DELETE /api/wishlist/:productId
        // =========================================================

        remove: async (productId) => {
          const cleanProductId =
            String(productId).trim();

          if (!cleanProductId) {
            throw new Error(
              'Unable to remove wishlist item.',
            );
          }

          try {
            await wishlistRequest(
              `/api/wishlist/${encodeURIComponent(
                cleanProductId,
              )}`,
              {
                method: 'DELETE',
              },
            );

            set((state) => ({
              items: state.items.filter(
                (item) =>
                  item.productId !==
                  cleanProductId,
              ),
            }));
          } catch (error) {
            console.error(
              'Wishlist remove failed:',
              error,
            );

            const message =
              error instanceof Error
                ? error.message
                : 'Unable to remove from wishlist.';

            throw new Error(message);
          }
        },

        // =========================================================
        // CHECK LOCAL STATE
        // =========================================================

        has: (productId) =>
          get().items.some(
            (item) =>
              item.productId ===
              productId,
          ),

        // =========================================================
        // CLEAR ALL
        // DELETE /api/wishlist
        // =========================================================

        clear: async () => {
          try {
            await wishlistRequest(
              '/api/wishlist',
              {
                method: 'DELETE',
              },
            );

            set({
              items: [],
            });
          } catch (error) {
            console.error(
              'Wishlist clear failed:',
              error,
            );

            const message =
              error instanceof Error
                ? error.message
                : 'Unable to clear wishlist.';

            throw new Error(message);
          }
        },

        // =========================================================
        // LOGOUT / LOCAL RESET
        // =========================================================

        clearLocal: () => {
          set({
            items: [],
          });
        },
      }),

      {
        name: 'ardenby-wishlist',

        storage:
          createJSONStorage(
            () => localStorage,
          ),
      },
    ),
  );