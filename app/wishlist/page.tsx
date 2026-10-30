'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

import { useWishlistStore } from '@/store/wishlist-store';
import { useCartStore } from '@/store/cart-store';
import { CustomerAuthGate } from '@/components/auth/customer-auth-gate';
import { apiUrl } from '@/lib/api-url';
import { normalizeApiProduct } from '@/lib/home-products';
import type { ApiProduct } from '@/lib/home-products';

import {
  FOCUS,
  WishlistCard,
  cartLine,
  defaultSize,
  isOutOfStock,
  type ProductDetail,
} from './wishlist-card';
import {
  CONTAINER,
  EmptyWishlist,
  ExploreTile,
  StickyCartBar,
  WishlistError,
  WishlistHero,
  WishlistSkeleton,
} from './wishlist-sections';

type SortKey = 'recent' | 'price-asc' | 'price-desc' | 'name';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recent', label: 'Recently added' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A to Z' },
];

const REMOVE_FADE_MS = 200;

function WishlistPageView() {
  const { items, remove, clear, syncFromApi } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [sort, setSort] = useState<SortKey>('recent');
  const [details, setDetails] = useState<Record<string, ProductDetail>>({});
  const [chosenSizes, setChosenSizes] = useState<Record<string, string>>({});
  const [removing, setRemoving] = useState<string[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [addingAll, setAddingAll] = useState(false);

  const requested = useRef(new Set<string>());

  // The sticky bar only appears once the hero's own "Add all" buttons have scrolled away.
  const [heroActionsVisible, setHeroActionsVisible] = useState(true);
  const [gridInView, setGridInView] = useState(false);
  const heroObserver = useRef<IntersectionObserver | null>(null);
  const gridObserver = useRef<IntersectionObserver | null>(null);
  const heroActionsRef = useCallback((node: HTMLDivElement | null) => {
    heroObserver.current?.disconnect();
    if (!node || typeof IntersectionObserver === 'undefined') return;
    heroObserver.current = new IntersectionObserver(([entry]) => setHeroActionsVisible(entry.isIntersecting));
    heroObserver.current.observe(node);
  }, []);
  // The bar must not float over the footer, so it only shows while the pieces are on screen.
  const gridRef = useCallback((node: HTMLElement | null) => {
    gridObserver.current?.disconnect();
    if (!node || typeof IntersectionObserver === 'undefined') return;
    gridObserver.current = new IntersectionObserver(([entry]) => setGridInView(entry.isIntersecting));
    gridObserver.current.observe(node);
  }, []);

  // Refresh from the backend so the page always reflects the signed-in user's saved pieces.
  const load = useCallback(async () => {
    setStatus('loading');
    try {
      await syncFromApi();
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [syncFromApi]);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('ardenby_token')) {
      void load();
    } else {
      setStatus('ready');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The wishlist only stores id/slug/price, so sizes and stock come from the product API.
  useEffect(() => {
    items.forEach((item) => {
      if (!item.slug || requested.current.has(item.productId)) return;
      requested.current.add(item.productId);

      fetch(apiUrl(`/api/products/${encodeURIComponent(item.slug)}`), { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
        .then((data) => {
          const raw: ApiProduct | undefined = data?.product ?? data?.data?.product;
          if (!raw?.id) throw new Error('Unexpected product response');
          setDetails((d) => ({ ...d, [item.productId]: normalizeApiProduct(raw) }));
        })
        .catch(() => {
          setDetails((d) => ({ ...d, [item.productId]: null }));
        });
    });
  }, [items]);

  const retry = () => {
    requested.current.clear();
    setDetails({});
    void load();
  };

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

  // Items fading out no longer count, so the stats and sticky bar update instantly.
  const live = useMemo(() => items.filter((i) => !removing.includes(i.productId)), [items, removing]);
  const totalValue = useMemo(() => live.reduce((sum, i) => sum + Number(i.price || 0), 0), [live]);
  const totalSavings = useMemo(
    () => live.reduce((sum, i) => sum + Math.max(0, Number(i.mrp || 0) - Number(i.price || 0)), 0),
    [live]
  );

  const sizeFor = (productId: string) => {
    const product = details[productId];
    return chosenSizes[productId] ?? (product ? defaultSize(product) : undefined);
  };

  const removeItem = (productId: string) => {
    setRemoving((r) => [...r, productId]);
    window.setTimeout(async () => {
      try {
        await remove(productId);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Unable to remove from wishlist.');
      } finally {
        setRemoving((r) => r.filter((id) => id !== productId));
      }
    }, REMOVE_FADE_MS);
  };

  const clearAll = async () => {
    setClearing(true);
    try {
      await clear();
      setConfirmClear(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to clear wishlist.');
    } finally {
      setClearing(false);
    }
  };

  const addAll = async () => {
    if (addingAll) return;
    setAddingAll(true);

    let added = 0;
    let outOfStock = 0;
    let failed = 0;

    // Sequential: each add re-syncs the cart, so parallel calls could overwrite each other.
    for (const item of live) {
      const product = details[item.productId];
      if (!product) {
        failed += 1;
      } else if (isOutOfStock(product)) {
        outOfStock += 1;
      } else {
        const line = cartLine(item, product, sizeFor(item.productId));
        if (!line) failed += 1;
        else if (await addItem(line)) added += 1;
        else failed += 1;
      }
    }

    setAddingAll(false);

    const noun = (n: number) => `${n} ${n === 1 ? 'item' : 'items'}`;
    const notes = [
      outOfStock > 0 && `${outOfStock} ${outOfStock === 1 ? 'is' : 'are'} out of stock.`,
      failed > 0 && `${failed} couldn't be added.`,
    ].filter(Boolean);

    if (added > 0) {
      toast.success([`${noun(added)} added to your bag.`, ...notes].join(' '));
    } else {
      toast.error(notes.join(' ') || 'Nothing could be added.');
    }
  };

  const share = async () => {
    const url = window.location.href;

    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'My KOVENIK Wishlist', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch (error) {
      // Dismissing the native share sheet is not a failure.
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error('Could not share the link.');
    }
  };

  const showSkeleton = status === 'loading' && items.length === 0;
  const isEmpty = status === 'ready' && items.length === 0;

  return (
    <div className="kv-page text-[#111111]">
      <WishlistHero
        count={live.length}
        total={totalValue}
        savings={totalSavings}
        addingAll={addingAll}
        onAddAll={addAll}
        onShare={share}
        actionsRef={heroActionsRef}
      />

      {status === 'error' && items.length === 0 ? (
        <WishlistError onRetry={retry} />
      ) : isEmpty ? (
        <EmptyWishlist />
      ) : (
        <>
          <section ref={gridRef} aria-label="Saved pieces" className={`${CONTAINER} pb-28 lg:pb-20`}>
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 pb-[14px] pt-4 sm:pb-6 sm:pt-8">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 sm:gap-x-7">
                <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-[#111111]">
                  {live.length} {live.length === 1 ? 'ITEM' : 'ITEMS'}
                </p>

                {live.length > 0 &&
                  (confirmClear ? (
                    <div className="flex items-center gap-3 text-[12px] font-bold uppercase tracking-[0.16em]" role="alert">
                      <span className="text-[#595959]">Clear all?</span>
                      <button
                        type="button"
                        onClick={clearAll}
                        disabled={clearing}
                        className={`min-h-[44px] text-[#B3261E] disabled:opacity-60 ${FOCUS}`}
                      >
                        {clearing ? 'Clearing…' : 'Yes, clear'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClear(false)}
                        disabled={clearing}
                        className={`min-h-[44px] text-[#111111] ${FOCUS}`}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClear(true)}
                      className={`min-h-[44px] border-b border-[#E5E5E5] text-[12px] font-bold uppercase tracking-[0.16em] text-[#828282] hover:text-[#111111] ${FOCUS}`}
                    >
                      Clear all
                    </button>
                  ))}
              </div>

              {live.length > 0 && (
                <label className="relative flex min-h-[44px] shrink-0 cursor-pointer items-center gap-2 text-[15px]">
                  <span className="hidden text-[#828282] sm:inline">Sort by</span>
                  <span className="font-semibold text-[#111111]">
                    {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                  </span>
                  <ChevronDown className="h-4 w-4 text-[#111111]" aria-hidden />
                  <select
                    aria-label="Sort wishlist"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className={`absolute inset-0 h-full w-full cursor-pointer opacity-0 ${FOCUS}`}
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            {showSkeleton ? (
              <WishlistSkeleton />
            ) : (
              <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 lg:gap-7">
                {sorted.map((item) => (
                  <WishlistCard
                    key={item.productId}
                    item={item}
                    product={details[item.productId]}
                    size={sizeFor(item.productId)}
                    removing={removing.includes(item.productId)}
                    onSize={(size) => setChosenSizes((s) => ({ ...s, [item.productId]: size }))}
                    onRemove={() => removeItem(item.productId)}
                  />
                ))}
                <ExploreTile />
              </ul>
            )}
          </section>

          {live.length > 0 && <StickyCartBar total={totalValue} busy={addingAll} visible={!heroActionsVisible && gridInView} onAddAll={addAll} />}
        </>
      )}
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
