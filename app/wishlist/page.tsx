'use client';

import Link from 'next/link';
import { Heart, Trash2, ArrowRight } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlist-store';
import { formatINR } from '@/lib/format';

/* KOVENIK palette: black #0A0A0A, charcoal #141210, ivory #F3EBDD,
   gold #C9A24B, champagne #E6CF92 */
const GOLD_SURFACE =
  'bg-[linear-gradient(135deg,#B8903A_0%,#E6CF92_48%,#C9A24B_100%)] text-[#0A0A0A]';

export default function WishlistPage() {
  const { items, remove, clear } = useWishlistStore();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F3EBDD] py-10 lg:py-16">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Header */}
        <header className="pb-5 border-b border-[#C9A24B]/50">
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#C9A24B] font-semibold">
            Your collection
          </p>

          <div className="mt-3 flex items-end justify-between gap-4">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight">
              Wishlist <span className="text-[#C9A24B] text-2xl sm:text-3xl align-middle">✦</span>
            </h1>

            {items.length > 0 && (
              <div className="flex flex-col items-end gap-1 pb-1.5">
                <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] whitespace-nowrap">
                  {String(items.length).padStart(2, '0')} {items.length === 1 ? 'Item' : 'Items'}
                </span>
                <button
                  onClick={clear}
                  className="text-[11px] uppercase tracking-[0.2em] text-[#F3EBDD]/50 hover:text-[#E6CF92] underline-offset-4 hover:underline transition-colors min-h-[32px]"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </header>

        {items.length === 0 ? (
          /* Empty state */
          <div className="mt-10 flex flex-col items-center text-center py-20 sm:py-28 rounded-3xl border border-[#C9A24B]/30 bg-[#141210]">
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
          <div className="mt-8 lg:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {items.map((item) => (
              <div
                key={item.productId}
                className="group relative rounded-2xl border border-[#C9A24B]/20 bg-[#141210] p-2 sm:p-3 hover:border-[#C9A24B]/55 hover:shadow-[0_0_28px_rgba(201,162,75,0.08)] transition-all duration-300"
              >
                <Link href={`/product/${item.slug}`} className="block">
                  <div className="aspect-[4/5] rounded-xl overflow-hidden bg-[#0A0A0A] border border-[#C9A24B]/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  </div>

                  <div className="px-1 pt-3 pb-1">
                    <h2 className="font-medium text-sm sm:text-base leading-snug text-[#F3EBDD] group-hover:text-[#E6CF92] transition-colors line-clamp-2">
                      {item.name}
                    </h2>
                    <p className="mt-1.5 font-bold text-base sm:text-lg tracking-tight text-[#E6CF92]">
                      {formatINR(item.price)}
                    </p>
                  </div>
                </Link>

                <button
                  aria-label={`Remove ${item.name}`}
                  onClick={() => remove(item.productId)}
                  className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 h-11 w-11 flex items-center justify-center rounded-full bg-[#0A0A0A]/80 backdrop-blur border border-[#C9A24B]/40 text-[#F3EBDD]/70 hover:text-[#E6CF92] hover:border-[#E6CF92] transition-colors"
                >
                  <Trash2 className="h-4 w-4 stroke-[1.5]" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}