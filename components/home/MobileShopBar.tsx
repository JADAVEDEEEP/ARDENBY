'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Heart, Home, ShoppingBag, ShoppingCart, User } from 'lucide-react';

import { cn } from '@/lib/utils';
import { getCartCount, useCartStore } from '@/store/cart-store';
import { useWishlistStore } from '@/store/wishlist-store';

const ITEM =
  'chrome-focus relative flex min-h-[48px] min-w-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[9px] font-semibold uppercase tracking-[0.1em] transition-colors';

/** Floating glass bottom bar, mobile only (hidden md+). It hides while the cart
 *  drawer is open. The mobile menu drawer sits above it (z-[9900]) and toasts
 *  render at the top, so neither is covered. */
export function MobileShopBar({ variant = 'dark' }: { variant?: 'dark' | 'silver' }) {
  const pathname = usePathname() ?? "";
  const silver = variant === 'silver';
  const idle = silver ? 'text-white/85 hover:text-white' : 'text-kv-muted hover:text-white';
  const activeCls = silver
    ? 'bg-[linear-gradient(180deg,#fafafc,#c9cbd2_55%,#8f929b)] text-[#121214] shadow-[inset_0_1px_0_rgba(255,255,255,.7)]'
    : 'text-white';
  const cartOpen = useCartStore((s) => s.isOpen);
  const cartCount = useCartStore((s) => getCartCount(s.items));
  const wishlistCount = useWishlistStore((s) => s.items.length);

  // Counts come from persisted client stores; render them only after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (cartOpen) return null;

  const badge = (count: number) =>
    mounted && count > 0 ? (
      <span className="absolute right-2 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#c9a24a] px-1 text-[9px] font-bold leading-none text-[#17120a]">
        {count}
      </span>
    ) : null;

  return (
    <nav
      aria-label="Shop bar"
      className={cn('chrome-scope fixed inset-x-3 bottom-3 md:hidden', silver ? 'z-[60]' : 'z-40')}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className={cn(
          'flex items-center gap-1 rounded-full px-2 py-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.6)]',
          silver
            ? 'border border-white/[0.38] backdrop-blur-[22px] [-webkit-backdrop-filter:blur(22px)] bg-[linear-gradient(180deg,rgba(236,236,240,.30),rgba(170,170,178,.20)_48%,rgba(96,96,104,.32))]'
            : 'chrome-glass bg-black/60'
        )}
      >
        <Link
          href="/"
          aria-current={pathname === '/' ? 'page' : undefined}
          className={cn(ITEM, pathname === '/' ? activeCls : idle)}
        >
          <Home className="h-[18px] w-[18px]" strokeWidth={1.6} />
          Home
        </Link>
        <Link
          href="/shop"
          aria-current={pathname === '/shop' ? 'page' : undefined}
          className={cn(ITEM, pathname === '/shop' && silver ? activeCls : idle)}
        >
          <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.6} />
          Shop
        </Link>
        <Link href="/wishlist" className={cn(ITEM, idle)}>
          <Heart className="h-[18px] w-[18px]" strokeWidth={1.6} />
          Wishlist
          {badge(wishlistCount)}
        </Link>
        <Link href="/cart" className={cn(ITEM, idle)}>
          <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={1.6} />
          Cart
          {badge(cartCount)}
        </Link>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('kovenik:open-account'))}
          className={cn(ITEM, idle)}
        >
          <User className="h-[18px] w-[18px]" strokeWidth={1.6} />
          Account
        </button>
      </div>
    </nav>
  );
}
