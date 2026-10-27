'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import type { CartItem, Product } from '@/types';
import type { WishlistItem } from '@/store/wishlist-store';
import { useCartStore } from '@/store/cart-store';
import { formatINR } from '@/lib/format';

export const DISPLAY = { fontFamily: 'var(--font-oswald), Impact, sans-serif' } as const;

export const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171717]';

export const BTN_TEXT = 'text-[13px] font-bold uppercase tracking-[0.16em]';

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

/* ------------------------------ mobile size sheet ------------------------------ */

function SizeSheet({
  name,
  product,
  selected,
  busy,
  onSelect,
  onConfirm,
  onClose,
}: {
  name: string;
  product: Product;
  selected: string | undefined;
  busy: boolean;
  onSelect: (size: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Select a size for ${name}`}
        className="w-full bg-white px-4 pt-5"
        style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8A847A]">Select size</p>
            <p className="mt-1 line-clamp-1 text-[15px] font-bold text-[#171717]">{name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close size picker"
            className={`-mr-2 -mt-2 flex h-11 w-11 items-center justify-center text-[#171717] ${FOCUS}`}
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Size">
          {sizesOf(product).map((size) => {
            const available = isSizeAvailable(product, size);
            const active = selected === size;
            return (
              <button
                key={size}
                type="button"
                disabled={!available}
                aria-pressed={active}
                onClick={() => onSelect(size)}
                className={`h-11 min-w-[56px] rounded-[2px] border px-4 text-[14px] font-bold disabled:cursor-not-allowed disabled:text-[#8A847A] disabled:line-through ${FOCUS} ${
                  active ? 'border-[#171717] bg-[#171717] text-[#F4F0E8]' : 'border-[#E2DBCF] text-[#171717]'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onConfirm}
          disabled={!selected || busy}
          className={`mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-[2px] bg-[#171717] text-[#F4F0E8] disabled:opacity-50 ${BTN_TEXT} ${FOCUS}`}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? 'ADDING…' : 'ADD TO BAG'}
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------- card ----------------------------------- */

export function WishlistCard({
  item,
  product,
  size,
  isMobile,
  removing,
  onSize,
  onRemove,
}: {
  item: WishlistItem;
  product: ProductDetail;
  size: string | undefined;
  isMobile: boolean;
  removing: boolean;
  onSize: (size: string) => void;
  onRemove: () => void;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const [status, setStatus] = useState<'idle' | 'adding' | 'added'>('idle');
  const [sheetOpen, setSheetOpen] = useState(false);
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
    setSheetOpen(false);

    if (!ok) {
      setStatus('idle');
      return;
    }

    setStatus('added');
    toast.success(`${item.name} added to your bag`);
    timer.current = window.setTimeout(() => setStatus('idle'), 1500);
  };

  const onAddClick = () => {
    // On mobile the shopper picks the size in a sheet first (unless there is only one).
    if (isMobile && sizes.length > 1) {
      setSheetOpen(true);
      return;
    }
    void add(size ?? sizes[0]);
  };

  const addLabel =
    status === 'adding' ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> ADDING…
      </>
    ) : status === 'added' ? (
      <>
        ADDED <Check className="h-4 w-4" aria-hidden />
      </>
    ) : (
      'ADD TO BAG'
    );

  return (
    <li
      className={`flex min-w-0 flex-col transition duration-200 ease-out ${
        removing ? 'scale-[0.98] opacity-0' : 'opacity-100'
      }`}
    >
      <div className="relative">
        <Link href={href} aria-label={item.name} className={`block ${FOCUS}`}>
          <div className="relative aspect-[4/4.8] overflow-hidden rounded-[2px] bg-[#ECE6DB] sm:aspect-[4/4.6]">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image} alt={item.name} className="h-full w-full object-cover object-center" />
            ) : null}
            {off > 0 && (
              <span className="absolute left-2 top-2 bg-[#171717] px-2 py-[5px] text-[10.5px] font-bold leading-none tracking-[0.12em] text-[#F4F0E8] sm:left-3 sm:top-3">
                −{off}%
              </span>
            )}
          </div>
        </Link>

        {/* 44px tap area around a 32/34px visual circle */}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${item.name} from wishlist`}
          className={`absolute right-0 top-0 flex h-11 w-11 items-center justify-center sm:right-[-1px] sm:top-[-1px] ${FOCUS}`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#171717] sm:h-[34px] sm:w-[34px]">
            <X className="h-4 w-4" strokeWidth={1.4} />
          </span>
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-[5px] pt-[10px] sm:gap-2 sm:pt-4">
        {product?.categoryLabel ? (
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A847A] sm:text-[12px]">
            {product.categoryLabel}
          </p>
        ) : null}

        <Link href={href} className={`block ${FOCUS}`}>
          <h3
            title={item.name}
            className="line-clamp-2 min-h-[40px] break-words text-[15px] font-bold leading-5 text-[#171717] sm:min-h-0 sm:text-[18px] sm:leading-6"
          >
            {item.name}
          </h3>
        </Link>

        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="whitespace-nowrap text-[17px] font-extrabold tabular-nums text-[#171717] sm:text-[20px]">
            {formatINR(item.price)}
          </span>
          {hasDiscount && (
            <span className="whitespace-nowrap text-[13px] tabular-nums text-[#8A847A] line-through sm:text-[14px]">
              {formatINR(item.mrp)}
            </span>
          )}
          {hasDiscount && (
            <span className="hidden whitespace-nowrap text-[13px] font-bold text-[#8C6D3F] lg:inline">
              Save {formatINR(item.mrp - item.price)}
            </span>
          )}
        </p>

        <div className="mt-auto flex gap-2 pt-[5px] sm:pt-[2px]">
          {product === undefined ? (
            <span
              aria-hidden
              className="h-12 flex-1 animate-pulse rounded-[2px] bg-[#ECE6DB] sm:h-[48px]"
            />
          ) : soldOut ? (
            <button
              type="button"
              disabled
              className={`h-12 flex-1 cursor-not-allowed rounded-[2px] bg-[#EEEAE2] text-[#8A847A] sm:h-[48px] ${BTN_TEXT}`}
            >
              OUT OF STOCK
            </button>
          ) : !canBuyHere ? (
            // Product details unavailable: let the shopper choose on the product page.
            <Link
              href={href}
              className={`flex h-12 flex-1 items-center justify-center rounded-[2px] border border-[#171717] text-[#171717] sm:h-[48px] ${BTN_TEXT} ${FOCUS}`}
            >
              VIEW PIECE
            </Link>
          ) : (
            <>
              <label className="relative hidden h-[48px] w-[76px] shrink-0 items-center justify-center gap-1 rounded-[2px] border border-[#E2DBCF] text-[14px] font-bold text-[#171717] sm:flex">
                <span aria-hidden>{size ?? sizes[0]}</span>
                <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                <select
                  aria-label={`Size for ${item.name}`}
                  value={size ?? ''}
                  onChange={(e) => onSize(e.target.value)}
                  className={`absolute inset-0 h-full w-full cursor-pointer opacity-0 ${FOCUS}`}
                >
                  {sizes.map((s) => (
                    <option key={s} value={s} disabled={!isSizeAvailable(product!, s)}>
                      {s}
                      {isSizeAvailable(product!, s) ? '' : ' (sold out)'}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={onAddClick}
                disabled={status !== 'idle'}
                aria-busy={status === 'adding'}
                className={`flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-[2px] bg-[#171717] text-[#F4F0E8] transition-opacity disabled:opacity-80 sm:h-[48px] ${BTN_TEXT} ${FOCUS}`}
              >
                {addLabel}
              </button>
            </>
          )}
        </div>
      </div>

      {sheetOpen && product && (
        <SizeSheet
          name={item.name}
          product={product}
          selected={size}
          busy={status === 'adding'}
          onSelect={onSize}
          onConfirm={() => void add(size)}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </li>
  );
}
