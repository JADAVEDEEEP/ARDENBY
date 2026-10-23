'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Heart, Trash2, ArrowRight, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlist-store';
import { formatINR } from '@/lib/format';
import { IconDisc, MetalCard, SERIF_STYLE } from '@/components/profile/metal';
import { CustomerAuthGate } from '@/components/auth/customer-auth-gate';

type SortKey = 'recent' | 'price-asc' | 'price-desc' | 'name';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A to Z' },
];

function WishlistPageView() {
  const { items, remove, clear, syncFromApi } = useWishlistStore();
  const [sort, setSort] = useState<SortKey>('recent');

  // Refresh from the backend so the page always reflects the signed-in user's saved pieces.
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('ardenby_token')) {
      void syncFromApi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = useMemo(() => {
    const list = [...items];
    switch (sort) {
      case 'price-asc':
        return list.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return list.sort((a, b) => b.price - a.price);
      case 'name':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return list;
    }
  }, [items, sort]);

  const totalValue = items.reduce((sum, i) => sum + Number(i.price || 0), 0);
  const totalSavings = items.reduce((sum, i) => sum + Math.max(0, Number(i.mrp || 0) - Number(i.price || 0)), 0);

  return (
    <div className="kv-page min-h-screen pb-14 pt-5 text-white lg:pb-20 lg:pt-8">

      <div className="mx-auto max-w-[1280px] px-4 lg:px-8">
        {/* Hero */}
        <MetalCard>
          <span
            className="kv-wordmark absolute -bottom-4 right-4 hidden text-[150px] sm:block"
            style={SERIF_STYLE}
            aria-hidden
          >
            KOVENIK
          </span>
          <div className="relative px-5 py-8 sm:px-10 lg:px-12 lg:py-12">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[12px] text-[#9296A0]">
              <Link href="/" className="transition-colors hover:text-white">
                Home
              </Link>
              <span className="text-[#D6B06A]">&rsaquo;</span>
              <span className="text-[#C6C9CF]">Wishlist</span>
            </nav>

            <p className="kv-label mt-6">KOVENIK — SAVED PIECES</p>
            <h1 className="mt-3 text-[44px] font-normal leading-[1.05] text-white sm:text-[60px] lg:text-[76px]" style={SERIF_STYLE}>
              My Wishlist.
            </h1>
            <p className="mt-3 max-w-md text-[14px] leading-6 text-[#C6C9CF]">
              Your favourite pieces, saved for later.
            </p>

            {items.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="kv-pill">
                  <Heart className="h-3.5 w-3.5 text-[#D6B06A]" strokeWidth={1.7} />
                  {items.length} {items.length === 1 ? 'piece' : 'pieces'} saved
                </span>
                <span className="kv-pill">Total {formatINR(totalValue)}</span>
                {totalSavings > 0 && <span className="kv-pill !text-[#5FD08A]">Saving {formatINR(totalSavings)}</span>}
              </div>
            )}
          </div>
        </MetalCard>

        <div className="mt-5 lg:mt-6">
          {items.length === 0 ? (
            <MetalCard>
              <div className="flex flex-col items-center px-6 py-16 text-center sm:py-24">
                <IconDisc icon={Heart} size={64} />
                <h2 className="mt-6 text-[26px] text-white sm:text-[32px]" style={SERIF_STYLE}>
                  Your wishlist is empty
                </h2>
                <p className="mb-8 mt-2 max-w-sm text-[13px] leading-6 text-[#9296A0]">
                  Save the pieces you love and they will wait for you here.
                </p>
                <Link href="/shop" className="kv-btn-primary">
                  Explore the shop <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </MetalCard>
          ) : (
            <MetalCard>
              <div className="p-4 sm:p-6">
                {/* Toolbar */}
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="text-[12px] font-bold uppercase tracking-[0.16em] text-white">
                      {items.length} {items.length === 1 ? 'Item' : 'Items'}
                    </h2>
                    <button
                      type="button"
                      onClick={clear}
                      className="min-h-[44px] text-[11px] uppercase tracking-[0.18em] text-[#9296A0] transition-colors hover:text-[#EF7B7B]"
                    >
                      Clear all
                    </button>
                  </div>

                  <label className="relative flex min-h-[48px] cursor-pointer items-center gap-3 rounded-full border border-[#42454C] bg-[#1E2024] px-4 sm:w-[260px]">
                    <SlidersHorizontal className="h-4 w-4 shrink-0 text-[#D6B06A]" strokeWidth={1.7} />
                    <span className="flex flex-1 flex-col leading-tight">
                      <span className="text-[10px] text-[#9296A0]">Sort by</span>
                      <span className="text-[13px] text-white">{SORT_OPTIONS.find((o) => o.value === sort)?.label}</span>
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-[#9296A0]" />
                    <select
                      aria-label="Sort wishlist"
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortKey)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value} className="bg-[#16171B] text-white">
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                  {sorted.map((item) => {
                    const hasDiscount = item.mrp > item.price;
                    const off = hasDiscount ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;

                    return (
                      <div
                        key={item.productId}
                        className="group relative min-w-0 overflow-hidden rounded-2xl border border-[#33363D] bg-[#141518] transition-colors hover:border-[#5a5e67]"
                      >
                        <Link href={`/product/${item.slug}`} className="block">
                          <div className="relative aspect-[4/5] overflow-hidden border-b border-[#2c2e34] bg-[radial-gradient(circle_at_50%_30%,#2e3036,#141518)]">
                            {item.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                              />
                            ) : null}
                            {off > 0 && (
                              <span className="absolute left-3 top-3 rounded-full border border-[#5a4a2a] bg-[#261f12]/90 px-2.5 py-1 text-[10px] font-semibold text-[#D6B06A]">
                                {off}% OFF
                              </span>
                            )}
                          </div>

                          <div className="px-3 pb-4 pt-3 sm:px-4">
                            <h3
                              title={item.name}
                              className="line-clamp-2 min-h-[38px] break-words text-[13px] font-medium leading-[19px] text-white sm:text-[14px]"
                            >
                              {item.name}
                            </h3>
                            <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
                              <span className="text-[16px] font-semibold tabular-nums text-white sm:text-[18px]">
                                {formatINR(item.price)}
                              </span>
                              {hasDiscount && (
                                <span className="text-[12px] tabular-nums text-[#9296A0] line-through">{formatINR(item.mrp)}</span>
                              )}
                            </p>
                          </div>
                        </Link>

                        <button
                          type="button"
                          aria-label={`Remove ${item.name} from wishlist`}
                          onClick={() => remove(item.productId)}
                          className="kv-disc absolute right-3 top-3 h-11 w-11 transition hover:brightness-125"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.7} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </MetalCard>
          )}
        </div>
      </div>
    </div>
  );
}

// Customer-only page: signed-out visitors are asked to sign in and brought back here.
export default function WishlistPage() {
  return (
    <CustomerAuthGate title="Sign in to view your wishlist">
      <WishlistPageView />
    </CustomerAuthGate>
  );
}
