'use client';

import { useCallback, useState } from 'react';
import type { MouseEvent } from 'react';

import { toast } from 'sonner';

import { useWishlistStore } from '@/store/wishlist-store';
import type { Product } from '@/types';

/** Wishlist toggle + login-required modal state, same behaviour as ProductCard:
 *  logged-out users (no `ardenby_token`) get the login modal instead. */
export function useWishlistToggle(product: Product) {
  const wishlist = useWishlistStore();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const isWishlisted = wishlist.has(product.id);

  const closeLoginModal = useCallback(() => setLoginModalOpen(false), []);

  const toggle = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('ardenby_token')
        : null;

    if (!token) {
      setLoginModalOpen(true);
      return;
    }

    const wasWishlisted = isWishlisted;

    wishlist
      .toggle({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0],
        price: product.price,
        mrp: product.mrp,
      })
      .then(() => {
        toast.success(wasWishlisted ? 'Removed from wishlist' : 'Added to wishlist', {
          duration: 2500,
        });
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : 'Unable to update wishlist.');
      });
  };

  return { isWishlisted, toggle, loginModalOpen, closeLoginModal };
}
