'use client';

import Link from 'next/link';
import { ArrowRight, Heart, Loader2 } from 'lucide-react';

import { formatINR } from '@/lib/format';
import { BTN_TEXT, DISPLAY, FOCUS } from './wishlist-card';

export const CONTAINER = 'mx-auto w-full max-w-[1440px] px-4 sm:px-8 lg:px-24';

/* ----------------------------------- hero ----------------------------------- */

function Stat({ label, value, gold = false }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#828282]">{label}</dt>
      <dd
        className={`mt-1.5 whitespace-nowrap text-[26px] font-bold leading-none lg:text-[34px] ${
          gold ? 'text-[#E53935]' : 'text-[#111111]'
        }`}
        style={DISPLAY}
      >
        {value}
      </dd>
    </div>
  );
}

export function AddAllButton({
  onClick,
  busy,
  className = '',
  tabIndex,
}: {
  onClick: () => void;
  busy: boolean;
  className?: string;
  tabIndex?: number;
}) {
  return (
    <button
      type="button"
      tabIndex={tabIndex}
      onClick={onClick}
      disabled={busy}
      aria-busy={busy}
      className={`flex items-center justify-center gap-2 rounded-[2px] bg-[#E53935] text-white transition-opacity disabled:opacity-70 ${BTN_TEXT} ${FOCUS} ${className}`}
    >
      {busy ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> ADDING…
        </>
      ) : (
        <>
          ADD ALL TO BAG <ArrowRight className="h-4 w-4" aria-hidden />
        </>
      )}
    </button>
  );
}

export function WishlistHero({
  count,
  total,
  savings,
  addingAll,
  onAddAll,
  onShare,
  actionsRef,
}: {
  actionsRef?: React.Ref<HTMLDivElement>;
  count: number;
  total: number;
  savings: number;
  addingAll: boolean;
  onAddAll: () => void;
  onShare: () => void;
}) {
  const hasItems = count > 0;

  return (
    <section aria-labelledby="wishlist-title" className="bg-[#F7F7F7]">
      <div className={`${CONTAINER} py-[22px] lg:flex lg:items-end lg:justify-between lg:pb-12 lg:pt-14`}>
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="text-[14px] text-[#828282]">
            <Link href="/" className={`hover:text-[#111111] ${FOCUS}`}>
              Home
            </Link>
            <span className="mx-2" aria-hidden>
              /
            </span>
            <span aria-current="page" className="font-semibold text-[#111111]">
              Wishlist
            </span>
          </nav>

          <p className="mt-4 text-[12px] font-bold uppercase tracking-[0.22em] text-[#E53935] lg:mt-7">
            KOVENIK — SAVED PIECES
          </p>

          <h1
            id="wishlist-title"
            className="mt-3 font-bold uppercase tracking-[0.02em] text-[#111111]"
            style={{ ...DISPLAY, fontSize: 'clamp(52px, 7vw, 96px)', lineHeight: 0.88 }}
          >
            My Wishlist
          </h1>

          <p className="mt-4 text-[16px] font-medium text-[#595959] lg:text-[18px]">
            Your favourite pieces, saved for later.
          </p>

          {hasItems && (
            <dl className="mt-[18px] grid grid-cols-3 gap-3 border-t border-[#E5E5E5] pt-[14px] lg:mt-8 lg:flex lg:gap-10 lg:border-0 lg:pt-0">
              <Stat label="Saved" value={`${count} ${count === 1 ? 'Piece' : 'Pieces'}`} />
              <Stat label="Total" value={formatINR(total)} />
              {savings > 0 && <Stat label="You save" value={formatINR(savings)} gold />}
            </dl>
          )}

          {/* Mobile / tablet: actions sit directly under the summary */}
          {hasItems && (
            <div ref={actionsRef} className="mt-6 flex flex-col gap-3 sm:max-w-[360px] lg:hidden">
              <AddAllButton onClick={onAddAll} busy={addingAll} className="h-[52px]" />
              <button
                type="button"
                onClick={onShare}
                className={`h-[52px] rounded-[2px] border border-[#111111] text-[#111111] ${BTN_TEXT} ${FOCUS}`}
              >
                SHARE WISHLIST
              </button>
            </div>
          )}
        </div>

        {hasItems && (
          <div className="hidden w-[300px] shrink-0 flex-col gap-3 lg:flex">
            <AddAllButton onClick={onAddAll} busy={addingAll} className="h-14" />
            <button
              type="button"
              onClick={onShare}
              className={`h-14 rounded-[2px] border border-[#111111] text-[#111111] ${BTN_TEXT} ${FOCUS}`}
            >
              SHARE WISHLIST
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------- explore tile ------------------------------- */

export function ExploreTile() {
  return (
    <li className="col-span-2 flex min-w-0 flex-col justify-center border border-[#E5E5E5] bg-white p-6 sm:col-span-1 lg:p-9">
      <p className="text-[12px] font-bold uppercase tracking-[0.22em] text-[#E53935]">KEEP EXPLORING</p>
      <h2
        className="mt-3 text-[28px] font-bold uppercase leading-[0.95] text-[#111111] lg:text-[40px]"
        style={DISPLAY}
      >
        Find your next piece.
      </h2>
      <p className="mt-3 hidden text-[16px] font-medium leading-6 text-[#595959] lg:block">
        New drops from Supreme Edition and The Print Club.
      </p>
      <Link
        href="/shop"
        className={`mt-5 flex h-12 items-center justify-center self-start rounded-[2px] bg-[#111111] px-8 text-[#F7F7F7] ${BTN_TEXT} ${FOCUS}`}
      >
        SHOP ALL
      </Link>
    </li>
  );
}

/* ------------------------------- sticky bar ------------------------------- */

export function StickyCartBar({
  total,
  busy,
  visible,
  onAddAll,
}: {
  total: number;
  busy: boolean;
  visible: boolean;
  onAddAll: () => void;
}) {
  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 flex items-center gap-4 border-t border-[#E5E5E5] bg-white px-4 pt-3 transition-transform duration-200 lg:hidden ${
        visible ? 'translate-y-0' : 'pointer-events-none translate-y-full'
      }`}
      style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
    >
      <div className="shrink-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#828282]">TOTAL</p>
        <p className="mt-0.5 whitespace-nowrap text-[22px] font-bold leading-none text-[#111111]" style={DISPLAY}>
          {formatINR(total)}
        </p>
      </div>
      <AddAllButton onClick={onAddAll} busy={busy} className="h-[52px] min-w-0 flex-1" tabIndex={visible ? 0 : -1} />
    </div>
  );
}

/* --------------------------- empty / error / skeleton --------------------------- */

export function EmptyWishlist() {
  return (
    <div className="flex flex-col items-center px-4 py-20 text-center lg:py-28">
      <Heart className="h-12 w-12 text-[#111111]" strokeWidth={1.1} aria-hidden />
      <h2 className="mt-6 text-[32px] font-bold uppercase leading-none text-[#111111]" style={DISPLAY}>
        Your wishlist is empty
      </h2>
      <p className="mt-3 max-w-sm text-[16px] text-[#595959]">Save pieces you love and find them here anytime.</p>
      <Link
        href="/shop"
        className={`mt-8 flex h-[52px] items-center justify-center rounded-[2px] bg-[#E53935] px-10 text-white ${BTN_TEXT} ${FOCUS}`}
      >
        START SHOPPING
      </Link>
    </div>
  );
}

export function WishlistError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center px-4 py-20 text-center">
      <p className="text-[15px] font-medium text-[#111111]">We couldn&apos;t load your wishlist.</p>
      <button
        type="button"
        onClick={onRetry}
        className={`mt-5 h-12 rounded-[2px] bg-[#111111] px-8 text-[#F7F7F7] ${BTN_TEXT} ${FOCUS}`}
      >
        TRY AGAIN
      </button>
    </div>
  );
}

export function WishlistSkeleton() {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-7" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <li
          key={i}
          className={i >= 3 ? 'hidden lg:block' : i >= 2 ? 'hidden sm:block' : undefined}
        >
          <div className="aspect-[4/4.8] animate-pulse rounded-[2px] bg-[#E5E5E5] sm:aspect-[4/4.6]" />
          <div className="mt-4 h-3 w-1/3 animate-pulse bg-[#E5E5E5]" />
          <div className="mt-3 h-4 w-3/4 animate-pulse bg-[#E5E5E5]" />
          <div className="mt-3 h-11 animate-pulse rounded-[2px] bg-[#E5E5E5] sm:h-[46px]" />
        </li>
      ))}
    </ul>
  );
}
