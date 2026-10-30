'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { formatINR } from '@/lib/format';
import { useWishlistStore } from '@/store/wishlist-store';
import { useCartStore } from '@/store/cart-store';
import { WishlistLoginModal } from '@/components/product/product-card';
import { RatingLink } from '@/components/product/rating-link';
import type { ToastPush } from '@/app/shop/shop-ui';
import {
  focusQty,
  normalizeProductColors,
  saveNotify,
  sizeQty,
  stateOfQty,
  totalStock,
  type ProductColorDot,
} from '@/app/shop/shop-stock';

import { discountPct } from './shop-filters';

export type ColorStatus = 'ok' | 'loading' | 'error';

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

function ColourDots({
  colors,
  status,
  onRetry,
}: {
  colors: ProductColorDot[];
  status: ColorStatus;
  onRetry: () => void;
}) {
  if (status === 'loading') {
    return (
      <span className="flex items-center gap-1.5" role="status" aria-label="Loading colours">
        {[0, 1, 2].map((i) => (
          <span key={i} className="kvl-skeleton h-[11px] w-[11px] rounded-full" />
        ))}
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span role="alert" className="text-[11px] text-[var(--muted)]">
        Colours couldn&apos;t load ·{' '}
        <button type="button" onClick={onRetry} className="font-semibold uppercase tracking-[0.1em] text-[var(--ink)] underline">
          Retry
        </button>
      </span>
    );
  }
  if (colors.length === 0) return <span className="h-[11px]" aria-hidden />;
  const shown = colors.slice(0, 4);
  const extra = colors.length - shown.length;
  return (
    <span className="flex items-center gap-1.5" aria-label={`Colours: ${colors.map((c) => c.name).join(', ')}`}>
      {shown.map((c) => (
        <span
          key={c.name}
          title={c.name}
          aria-hidden
          className="h-[11px] w-[11px] rounded-full border border-black/15"
          style={{ backgroundColor: c.hex }}
        />
      ))}
      {extra > 0 && <span className="text-[10.5px] font-medium text-[var(--muted)]">+{extra}</span>}
    </span>
  );
}

export function ProductCard({
  product,
  focusSizes,
  colorStatus,
  onRetryColors,
  onRefresh,
  onToast,
  priority = false,
}: {
  product: any;
  /** sizes currently selected in the filters */
  focusSizes: string[];
  colorStatus: ColorStatus;
  onRetryColors: (product: any) => void;
  /** fetch fresh variants from the server; resolves null if unavailable */
  onRefresh: (product: any) => Promise<any | null>;
  onToast: ToastPush;
  priority?: boolean;
}) {
  const wishlist = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();
  const isWishlisted = wishlist.has(product.id);
  const [loginOpen, setLoginOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const price: number = product.price;
  const mrp: number | undefined = product.mrp && product.mrp > price ? product.mrp : undefined;
  const pct = discountPct(product);
  const href = `/product/${product.slug}`;
  const images: string[] = product.images || [];

  const carried = ((product.sizes as string[]) || []).map((x) => String(x).toUpperCase());
  const sizes: string[] = carried.length ? ALL_SIZES.filter((s) => carried.includes(s)) : ALL_SIZES.slice(1, 6);
  const total = totalStock(product);
  const fullySoldOut = total <= 0;
  const soldOutInFocus = !fullySoldOut && focusSizes.length > 0 && focusQty(product, focusSizes) <= 0;
  const unavailable = fullySoldOut || soldOutInFocus;

  // No size is pre-selected (unless one is filtered): "Add to bag" stays disabled until the shopper picks one.
  const [size, setSize] = useState<string>(focusSizes[0] && sizes.includes(focusSizes[0]) ? focusSizes[0] : '');
  const focusKey = focusSizes.join(',');
  useEffect(() => {
    if (focusSizes[0] && sizes.includes(focusSizes[0])) setSize(focusSizes[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);

  const colors = normalizeProductColors(product);
  const tag = product.bestSeller ? 'BESTSELLER' : product.newArrival ? 'NEW' : null;

  const notify = (forSize?: string) => {
    saveNotify(product.id, forSize);
    onToast({
      variant: 'wish',
      title: 'Noted',
      message: `We'll flag ${product.name}${forSize ? ` in ${forSize}` : ''} for you.`,
    });
  };

  const soldOutToast = (p: any, s: string) => {
    const next = ALL_SIZES.find((x) => x !== s && sizeQty(p, x) > 0);
    onToast(
      {
        variant: 'stock',
        title: 'Out of stock',
        message: `${p.name} in size ${s} just sold out.`,
        thumb: p.images?.[0],
        actions: [
          { label: 'Notify me', primary: true, onClick: () => notify(s) },
          ...(next ? [{ label: `Try size ${next}`, onClick: () => setSize(next) }] : []),
        ],
      },
      { replace: true }
    );
  };

  const pickSize = (s: string) => {
    setSize(s);
    const q = sizeQty(product, s);
    if (stateOfQty(q) === 'low') {
      onToast(
        { variant: 'low', title: 'Low stock', message: `${product.name} — only ${q} left in ${s}.` },
        { replace: true }
      );
    }
  };

  const handleWishlist = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('ardenby_token') : null;
    if (!token) {
      setLoginOpen(true);
      return;
    }
    wishlist.toggle({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images?.[0],
      price: product.price,
      mrp: product.mrp,
    });
    if (!isWishlisted) {
      onToast({ variant: 'wish', title: 'Saved', message: `${product.name} saved to your wishlist.` });
    }
  };

  /** Re-checks stock with the server first; never adds a sold-out size. */
  const handleAdd = async () => {
    if (adding || !size) return;
    setAdding(true);
    let navigating = false;
    try {
      const fresh = (await onRefresh(product)) ?? product;
      if (sizeQty(fresh, size) <= 0) {
        soldOutToast(fresh, size);
        return;
      }
      const rawVariants: any[] = Array.isArray(fresh.variants) ? fresh.variants : [];
      const v = rawVariants.find(
        (x) =>
          String(x.size ?? '').trim().toUpperCase() === size &&
          Number(x.inventory ?? x.stock ?? 0) > 0 &&
          x.id
      );
      if (!v && rawVariants.length > 0) {
        soldOutToast(fresh, size);
        return;
      }
      const added = await addItem({
        productId: fresh.id,
        variantId: v?.id,
        slug: fresh.slug,
        name: fresh.name,
        image: fresh.images?.[0],
        size: v?.size ?? size,
        color: v?.color,
        price: fresh.price,
        mrp: fresh.mrp,
      });
      if (!added) return;
      // Keep `adding` set while navigating so the button can't fire twice.
      navigating = true;
      setPanelOpen(false);
      router.push('/cart');
    } finally {
      if (!navigating) setAdding(false);
    }
  };

  const hasSecond = images.length > 1;

  return (
    <article className="group relative min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--ivory-2)]">
        <Link href={href} aria-label={product.name} className="absolute inset-0 block">
          {images[0] && (
            <Image
              src={images[0]}
              alt={product.name}
              fill
              priority={priority}
              sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 24vw, (min-width: 768px) 33vw, 50vw"
              className={cn(
                'object-cover transition duration-500',
                !hasSecond && 'lg:group-hover:scale-[1.03]',
                hasSecond && 'lg:group-hover:opacity-0',
                unavailable && 'opacity-50 grayscale'
              )}
            />
          )}
          {hasSecond && (
            <Image
              src={images[1]}
              alt=""
              fill
              sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 24vw, 0px"
              className={cn(
                'hidden object-cover opacity-0 transition duration-500 lg:block lg:group-hover:opacity-100',
                unavailable && 'grayscale'
              )}
            />
          )}
        </Link>

        {tag && (
          <span
            className={cn(
              'pointer-events-none absolute left-0 top-3.5 px-2.5 py-[5px] text-[10px] font-semibold uppercase leading-none tracking-[0.14em] text-white lg:text-[11px]',
              tag === 'NEW' ? 'bg-[var(--gold)]' : 'bg-[var(--ink)]'
            )}
          >
            {tag}
          </span>
        )}

        <button
          type="button"
          onClick={handleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isWishlisted}
          className="absolute right-2 top-2 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[var(--ivory)]/[0.94] text-[var(--ink)] transition active:scale-95 max-md:h-7 max-md:w-7"
        >
          <Heart className={cn('h-4 w-4 max-md:h-3.5 max-md:w-3.5', isWishlisted && 'fill-[var(--ink)]')} strokeWidth={1.6} />
        </button>

        {unavailable && (
          <span className="pointer-events-none absolute left-1/2 top-1/2 max-w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--ivory)] px-4 py-1.5 text-center text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--ink)]">
            {soldOutInFocus ? `Sold out in ${focusSizes.join(', ')}` : 'Sold out'}
          </span>
        )}

        {/* Touch devices: a small "+" opens the panel (hover is not available) */}
        <button
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          aria-expanded={panelOpen}
          aria-label={panelOpen ? 'Close quick add' : `Quick add ${product.name}`}
          className="absolute bottom-2 right-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ivory)] text-[var(--ink)] [@media(hover:hover)]:hidden"
        >
          <Plus className={cn('h-[18px] w-[18px] transition-transform', panelOpen && 'rotate-45')} strokeWidth={1.8} />
        </button>

        {/* Quick add: slides up on hover / keyboard focus (hover devices) or via the "+" (touch) */}
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 z-10 border-t border-[#D2D2D2] bg-[#F7F7F7]/[0.96] p-3 transition duration-200',
            panelOpen
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-full opacity-0 [@media(hover:hover)]:group-focus-within:pointer-events-auto [@media(hover:hover)]:group-focus-within:translate-y-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:pointer-events-auto [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100'
          )}
        >
          {fullySoldOut ? (
            <button
              type="button"
              onClick={() => notify()}
              className="h-11 w-full border border-[#111111] text-[13px] font-semibold uppercase tracking-[0.16em] text-[#111111]"
            >
              Notify me
            </button>
          ) : (
            <>
              <div className="mb-2.5 flex flex-wrap justify-center gap-1.5" role="group" aria-label="Choose size">
                {sizes.map((s) => {
                  const out = sizeQty(product, s) <= 0;
                  const on = size === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={out}
                      aria-pressed={on}
                      aria-label={out ? `${s}, sold out` : s}
                      onClick={() => pickSize(s)}
                      className={cn(
                        'relative h-9 min-w-[44px] overflow-hidden border px-2 text-[13px] font-semibold',
                        out
                          ? 'cursor-not-allowed border-[#C3C3C3] bg-[#F7F7F7] text-[#B0B0B0]'
                          : on
                            ? 'border-[#111111] bg-[#111111] text-[#F7F7F7]'
                            : 'border-[#C3C3C3] bg-white text-[#111111] hover:border-[#111111]'
                      )}
                    >
                      {s}
                      {out && (
                        <span
                          aria-hidden
                          className="absolute inset-0"
                          style={{
                            background:
                              'linear-gradient(to top right, transparent calc(50% - 0.5px), #B0B0B0 calc(50% - 0.5px), #B0B0B0 calc(50% + 0.5px), transparent calc(50% + 0.5px))',
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={handleAdd}
                disabled={adding || !size}
                className="h-11 w-full bg-[#111111] text-[13px] font-semibold uppercase tracking-[0.16em] text-[#F7F7F7] disabled:cursor-not-allowed disabled:bg-[#878787]"
              >
                {adding ? 'Checking stock…' : 'Add to bag'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-1.5 pt-3.5">
        <ColourDots colors={colors} status={colorStatus} onRetry={() => onRetryColors(product)} />
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--soft)] lg:text-[12px]">Kovenik</p>
        <Link
          href={href}
          title={product.name}
          className="line-clamp-2 text-[14px] font-medium leading-[1.3] text-[var(--ink)] lg:line-clamp-1 lg:text-[16px]"
        >
          {product.name}
        </Link>
        <RatingLink slug={product.slug} rating={product.rating} reviewCount={product.reviewCount} />
        <p className="flex flex-wrap items-baseline gap-x-2 text-[15px] lg:text-[17px]">
          <span className={cn('font-semibold', unavailable ? 'text-[var(--muted)]' : 'text-[var(--ink)]')}>{formatINR(price)}</span>
          {mrp && <span className="text-[12px] text-[var(--soft)] line-through lg:text-[14px]">{formatINR(mrp)}</span>}
          {pct > 0 && <span className="text-[12px] font-semibold text-[var(--gold)] lg:text-[14px]">{pct}% OFF</span>}
        </p>
      </div>
      <WishlistLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </article>
  );
}
