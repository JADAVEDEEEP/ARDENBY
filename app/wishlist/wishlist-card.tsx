'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown, Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import type { CartItem, Product } from '@/types';
import type { WishlistItem } from '@/store/wishlist-store';
import { RatingLink } from '@/components/product/rating-link';
import { useCartStore } from '@/store/cart-store';
import { formatINR } from '@/lib/format';
import { MemberPriceTag } from '@/components/membership/member-price-tag';

export const DISPLAY = { fontFamily: 'var(--font-oswald), Impact, sans-serif' } as const;

export const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111]';

export const BTN_TEXT = 'text-[16px] font-bold uppercase tracking-[0.04em]';

/** undefined = still loading, null = could not be loaded. */
export type ProductDetail = Product | null | undefined;

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

/* ------------------------------ variant helpers ------------------------------ */

export function sizesOf(product: Product): string[] {
  const list = Array.from(new Set((product.variants ?? []).map((v) => String(v.size)).filter(Boolean)));
  return list.sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a);
    const bi = SIZE_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export function variantFor(product: Product, size: string | undefined) {
  return (product.variants ?? []).find((v) => String(v.size) === size && Number(v.inventory) > 0);
}

export function isSizeAvailable(product: Product, size: string): boolean {
  return Boolean(variantFor(product, size));
}

export function isOutOfStock(product: Product): boolean {
  return (product.variants ?? []).length > 0 && !(product.variants ?? []).some((v) => Number(v.inventory) > 0);
}

/** Prefers M (the usual size), otherwise the first size that is in stock. */
export function defaultSize(product: Product): string | undefined {
  const available = sizesOf(product).filter((s) => isSizeAvailable(product, s));
  return available.includes('M') ? 'M' : available[0];
}

export function cartLine(
  item: WishlistItem,
  product: Product,
  size: string | undefined
): Omit<CartItem, 'quantity'> | null {
  const variant = variantFor(product, size);
  if (!variant?.id) return null;

  return {
    productId: item.productId,
    variantId: variant.id,
    slug: item.slug,
    name: item.name,
    image: item.image,
    size: variant.size,
    color: variant.color,
    price: item.price,
    mrp: item.mrp,
  };
}

/* ----------------------------------- card ----------------------------------- */

export function WishlistCard({
  item,
  product,
  size,
  removing,
  onSize,
  onRemove,
}: {
  item: WishlistItem;
  product: ProductDetail;
  size: string | undefined;
  removing: boolean;
  onSize: (size: string) => void;
  onRemove: () => void;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [status, setStatus] = useState<'idle' | 'adding' | 'added'>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const hasDiscount = item.mrp > item.price;
  const off = hasDiscount ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;
  const href = `/product/${item.slug}`;

  const sizes = product ? sizesOf(product) : [];
  const soldOut = product ? isOutOfStock(product) : false;
  const canBuyHere = Boolean(product) && sizes.length > 0 && !soldOut;

  const add = async (chosen: string | undefined) => {
    if (!product || status === 'adding') return;
    const line = cartLine(item, product, chosen);
    if (!line) {
      toast.error('This size is currently unavailable.');
      return;
    }

    setStatus('adding');
    const ok = await addItem(line);

    if (!ok) {
      setStatus('idle');
      return;
    }

    setStatus('added');
    toast.success(`${item.name} added to your bag`);
    timer.current = window.setTimeout(() => setStatus('idle'), 1500);
  };

  const onAddClick = () => void add(size ?? sizes[0]);

  const addLabel =
    status === 'adding' ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Adding…
      </>
    ) : status === 'added' ? (
      <>
        <Check className="h-4 w-4" aria-hidden /> Added to bag
      </>
    ) : (
      'Add to bag'
    );

  return (
    <li
      className={`flex min-w-0 flex-col transition duration-200 ease-out ${
        removing ? 'scale-[0.98] opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative">
        <Link href={href} aria-label={item.name} className={`block ${FOCUS}`}>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2px] bg-[#F5F5F5]">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image} alt={item.name} className="h-full w-full object-cover object-center" />
            ) : null}
            {off > 0 && (
              <span className="absolute left-0 top-3 bg-[#EF3535] px-2.5 py-1.5 text-[14px] font-bold leading-none text-white">
                {off}% OFF
              </span>
            )}
          </div>
        </Link>

        {/* 44px tap area around the white heart */}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${item.name} from wishlist`}
          className={`absolute right-1 top-1 flex h-11 w-11 items-center justify-center ${FOCUS}`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
            <Heart className="h-5 w-5 fill-[#EF3535] text-[#EF3535]" strokeWidth={1.8} />
          </span>
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 pt-3 sm:pt-4">
        <Link href={href} className={`block ${FOCUS}`}>
          <h3
            title={item.name}
            className="line-clamp-2 min-h-[44px] break-words text-[17px] font-bold leading-[22px] text-[#111111] sm:min-h-[48px] sm:text-[18px] sm:leading-6"
          >
            {item.name}
          </h3>
        </Link>

        {product && (
          <RatingLink slug={item.slug} rating={product.rating} reviewCount={product.reviewCount} />
        )}

        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="whitespace-nowrap text-[18px] font-extrabold tabular-nums text-[#111111] sm:text-[20px]">
            {formatINR(item.price)}
          </span>
          {hasDiscount && (
            <span className="whitespace-nowrap text-[15px] tabular-nums text-[#666666] line-through">
              {formatINR(item.mrp)}
            </span>
          )}
        </p>
        <MemberPriceTag productId={item.productId} price={item.price} />

        {product !== undefined && (
          <p className={`flex items-center gap-1.5 text-[15px] ${soldOut ? 'font-semibold text-[#C8211F]' : 'text-[#666666]'}`}>
            {soldOut ? 'Out of stock' : (
              <>
                <span aria-hidden className="h-2 w-2 rounded-full bg-[#111111]" /> In stock
              </>
            )}
          </p>
        )}

        <div className="mt-auto flex flex-col gap-2 pt-2">
          {product === undefined ? (
            <span aria-hidden className="h-[44px] animate-pulse rounded-[2px] bg-[#E5E5E5]" />
          ) : soldOut ? (
            <button
              type="button"
              disabled
              className={`h-12 cursor-not-allowed rounded-[2px] bg-[#E5E5E5] text-[#666666] ${BTN_TEXT}`}
            >
              Out of stock
            </button>
          ) : !canBuyHere ? (
            // Product details unavailable: let the shopper choose on the product page.
            <Link
              href={href}
              className={`flex h-12 items-center justify-center rounded-[2px] border border-[#111111] text-[#111111] ${BTN_TEXT} ${FOCUS}`}
            >
              View piece
            </Link>
          ) : (
            <>
              <label className="relative block">
                <span className="sr-only">Size for {item.name}</span>
                <select
                  value={size ?? ''}
                  onChange={(e) => onSize(e.target.value)}
                  className={`h-12 w-full appearance-none rounded-[2px] border border-[#BDBDBD] bg-white px-4 pr-10 text-[16px] text-[#111111] ${FOCUS}`}
                >
                  {!size && <option value="">Select size</option>}
                  {sizes.map((s) => (
                    <option key={s} value={s} disabled={!isSizeAvailable(product!, s)}>
                      {s}
                      {isSizeAvailable(product!, s) ? '' : ' (sold out)'}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2" aria-hidden />
              </label>

              <button
                type="button"
                onClick={onAddClick}
                disabled={status !== 'idle' || !size}
                aria-busy={status === 'adding'}
                className={`flex h-12 w-full items-center justify-center gap-2 rounded-[2px] bg-[#111111] text-white transition-opacity disabled:opacity-80 ${BTN_TEXT} ${FOCUS}`}
              >
                {addLabel}
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
