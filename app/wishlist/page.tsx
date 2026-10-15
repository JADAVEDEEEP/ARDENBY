'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Heart, Trash2, ArrowRight, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlist-store';
import { formatINR } from '@/lib/format';

/* KOVENIK palette: charcoal #0A0A0A / #111111, black #050505,
   gold #C9A24B, champagne #E6CF92, ivory #F3EBDD */
const GOLD_SURFACE =
  'bg-[linear-gradient(135deg,#B8903A_0%,#E6CF92_48%,#C9A24B_100%)] text-[#0A0A0A]';

const GOLD_TEXT =
  'bg-[linear-gradient(135deg,#B8903A_0%,#E6CF92_50%,#C9A24B_100%)] bg-clip-text text-transparent';

type SortKey = 'recent' | 'price-asc' | 'price-desc' | 'name';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A to Z' },
];

/* Decorative colour swatches (wishlist items carry no colour data). */
const SWATCHES = ['#050505', '#2A2A2A', '#F3EBDD'];

/* Category label is derived from the product name when recognisable. */
function categoryOf(name: string): string | null {
  const n = name.toLowerCase();
  if (/(t-?shirt|tee)/.test(n)) return 'Oversized T-Shirt';
  if (/hood/.test(n)) return 'Hoodie';
  if (/(cargo|pant|trouser|jogger)/.test(n)) return 'Cargo Pants';
  if (/(sneaker|shoe)/.test(n)) return 'Sneakers';
  if (/jacket/.test(n)) return 'Jacket';
  if (/(cap|hat)/.test(n)) return 'Cap';
  return null;
}

export default function WishlistPage() {
  const { items, remove, clear } = useWishlistStore();
  const [sort, setSort] = useState<SortKey>('recent');

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

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,#1A1A1A_0%,#0C0C0C_45%,#030303_100%)] text-[#F3EBDD] pb-14 lg:pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#C9A24B]/30 bg-[linear-gradient(120deg,#111111_0%,#1A1A1A_55%,#0A0A0A_100%)]">
        <div className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_85%_30%,rgba(201,162,75,0.35),transparent_45%)]" />
        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 py-8 lg:py-14">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs sm:text-sm text-[#F3EBDD]/80"
          >
            <Link href="/" className="hover:text-[#E6CF92] transition-colors">
              Home
            </Link>
            <span className="text-[#C9A24B]">&rsaquo;</span>
            <span>Wishlist</span>
          </nav>

          <h1 className="mt-4 lg:mt-6 font-serif text-4xl sm:text-5xl lg:text-7xl font-normal tracking-tight">
            My <span className={GOLD_TEXT}>Wishlist</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#F3EBDD]/85 max-w-xl">
            Your favorite pieces, saved for later.
            <span className="hidden sm:inline"> Don&apos;t let them get away.</span>
          </p>

          <div className="hidden lg:flex absolute right-12 top-1/2 -translate-y-1/2 flex-col gap-3 text-[11px] uppercase tracking-[0.3em] text-[#F3EBDD]/80">
            <div className="flex items-center gap-4">
              <span className="h-px w-12 bg-[#C9A24B]" />
              Est. Kovenik
            </div>
            <div className="flex items-center gap-4 text-[9px] text-[#F3EBDD]/60">
              <span className="h-px w-12 bg-[#C9A24B]" />
              Wear your essence
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 mt-6 lg:mt-8">
        {items.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center text-center py-20 sm:py-28 rounded-2xl border border-[#C9A24B]/40 bg-[#0C0C0C]/80">
            <div className="w-16 h-16 rounded-full border border-[#C9A24B]/60 flex items-center justify-center mb-6">
              <Heart className="h-7 w-7 text-[#C9A24B] stroke-[1.5]" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl px-4">Your wishlist is empty</h2>
            <p className="mt-2 mb-8 text-sm text-[#F3EBDD]/60 max-w-sm px-6">
              Save the pieces you love and they will wait for you here.
            </p>
            <Link
              href="/shop"
              className={`inline-flex items-center gap-2 min-h-[48px] px-8 rounded-full text-xs font-bold uppercase tracking-widest ${GOLD_SURFACE} shadow-[0_0_24px_rgba(201,162,75,0.25)] hover:brightness-110 transition`}
            >
              Explore the shop
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <section className="rounded-2xl border border-[#C9A24B]/50 bg-[#0A0A0A]/80 p-3 sm:p-6 shadow-[0_0_40px_rgba(201,162,75,0.06)]">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-base sm:text-lg font-semibold text-[#E6CF92]">
                  {items.length} {items.length === 1 ? 'Item' : 'Items'}
                </h2>
                <button
                  onClick={clear}
                  className="text-[11px] uppercase tracking-[0.2em] text-[#F3EBDD]/50 hover:text-[#E6CF92] underline-offset-4 hover:underline transition-colors min-h-[32px]"
                >
                  Clear all
                </button>
              </div>

              <label className="relative flex items-center gap-3 rounded-lg border border-[#C9A24B]/50 bg-[#050505]/70 px-4 py-2 sm:w-[260px] cursor-pointer">
                <SlidersHorizontal className="h-5 w-5 text-[#C9A24B] stroke-[1.5] shrink-0" />
                <span className="flex flex-col leading-tight flex-1">
                  <span className="text-[10px] text-[#F3EBDD]/60">Sort by</span>
                  <span className="text-sm text-[#F3EBDD]">
                    {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                  </span>
                </span>
                <ChevronDown className="h-5 w-5 text-[#C9A24B] shrink-0" />
                <select
                  aria-label="Sort wishlist"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="bg-[#0A0A0A] text-[#F3EBDD]">
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {sorted.map((item) => {
                const category = categoryOf(item.name);
                const hasDiscount = item.mrp > item.price;

                return (
                  <div
                    key={item.productId}
                    className="group relative rounded-xl border border-[#C9A24B]/40 bg-[#0C0C0C] overflow-hidden hover:border-[#E6CF92]/80 hover:shadow-[0_0_28px_rgba(201,162,75,0.12)] transition-all duration-300"
                  >
                    <Link href={`/product/${item.slug}`} className="block">
                      <div className="aspect-[4/5] overflow-hidden bg-[#050505] border-b border-[#C9A24B]/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
                        />
                      </div>

                      <div className="px-3 sm:px-4 pt-3 pb-4">
                        <div className="flex items-center gap-1.5" aria-hidden="true">
                          {SWATCHES.map((c, i) => (
                            <span
                              key={i}
                              className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border border-[#F3EBDD]/70"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>

                        {category && (
                          <p className="mt-3 text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-[#C9A24B] font-semibold">
                            {category}
                          </p>
                        )}
                        <h3 className="mt-1 text-sm sm:text-base uppercase leading-snug text-[#F3EBDD] group-hover:text-[#E6CF92] transition-colors line-clamp-2">
                          {item.name}
                        </h3>
                        <p className="mt-2 flex items-baseline gap-2">
                          <span className="font-bold text-base sm:text-xl tracking-tight text-[#E6CF92]">
                            {formatINR(item.price)}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs sm:text-sm text-[#F3EBDD]/45 line-through">
                              {formatINR(item.mrp)}
                            </span>
                          )}
                        </p>
                      </div>
                    </Link>

                    {/* Wishlist heart (saved) */}
                    <span
                      aria-hidden="true"
                      className="absolute top-3 right-3 h-9 w-9 flex items-center justify-center rounded-full bg-[#050505]/70 backdrop-blur border border-[#C9A24B]/40 pointer-events-none"
                    >
                      <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                    </span>

                    {/* Remove */}
                    <div className="absolute inset-x-0 top-0 aspect-[4/5] pointer-events-none">
                      <button
                        aria-label={`Remove ${item.name}`}
                        onClick={() => remove(item.productId)}
                        className="pointer-events-auto absolute bottom-3 right-3 h-10 w-10 flex items-center justify-center rounded-full bg-[#050505]/80 backdrop-blur border border-[#C9A24B]/50 text-[#F3EBDD]/80 hover:text-[#E6CF92] hover:border-[#E6CF92] transition-colors"
                      >
                        <Trash2 className="h-4 w-4 stroke-[1.5]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
