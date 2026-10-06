'use client';

import type { useProfile } from '../../hooks/use-profile';

import { Heart, ShoppingBag, Trash2, ArrowUpRight, ArrowRight } from 'lucide-react';

type ProfileState = ReturnType<typeof useProfile>;

/* KOVENIK: surfaces #0A0A0A/#101010/#141414 · ivory #F3EBDD · gold #C9A24B · champagne #E6CF92 */
const GOLD_SURFACE =
  'bg-[linear-gradient(135deg,#9C7A32_0%,#E6CF92_45%,#B8903A_100%)] text-[#0A0A0A]';

export function WishlistSection({ profile }: { profile: ProfileState }) {
  const wishlistCount = profile.wishlist.length;

  return (
    <section>
      <p className="mb-5 text-[13px] text-[#F3EBDD]/60">Pieces you&apos;ve chosen to keep close.</p>

      {/* Header */}
      {wishlistCount > 0 && (
        <div className="mb-6 flex items-end justify-between gap-4 border-b border-[#C9A24B]/20 pb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C9A24B]">
              Saved Pieces
            </p>
            <p className="mt-1 text-sm text-[#F3EBDD]">
              {wishlistCount} {wishlistCount === 1 ? 'piece' : 'pieces'} saved
            </p>
          </div>

          <button
            type="button"
            onClick={() => profile.clearWishlist()}
            className="group inline-flex min-h-[44px] items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[#F3EBDD]/55 transition-colors duration-300 hover:text-[#E6CF92]"
          >
            <Trash2 className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-90" />
            Clear Wishlist
          </button>
        </div>
      )}

      {/* Empty State */}
      {wishlistCount === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-[1px] border-dashed border-[#C9A24B]/30 bg-[#0A0A0A] px-6 py-14 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border-[1px] border-[#C9A24B]/60 shadow-[0_0_20px_rgba(201,162,75,0.12)]">
            <Heart className="h-7 w-7 text-[#C9A24B]" strokeWidth={1.4} />
          </div>
          <h3 className="font-serif text-2xl text-[#F3EBDD]">Nothing saved yet</h3>
          <p className="mt-2 max-w-xs text-[13px] text-[#F3EBDD]/55">
            Save pieces you love and they will appear here.
          </p>
          <button
            type="button"
            onClick={() => profile.router.push('/')}
            className={`mt-7 inline-flex min-h-[48px] items-center gap-2 rounded-lg px-7 text-[11px] font-bold uppercase tracking-[0.16em] shadow-[0_0_20px_rgba(201,162,75,0.22)] transition hover:brightness-110 ${GOLD_SURFACE}`}
          >
            Explore Collection
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
          {profile.wishlist.map((item) => {
            /*
             * Backend wishlist response contains:
             * primary_image, slug, name, product_id, price
             */
            const wishlistItem = item as typeof item & {
              primary_image?: string;
              slug?: string;
            };

            const productName =
              wishlistItem.product_name || wishlistItem.name || 'KOVENIK Product';

            const image =
              wishlistItem.primary_image?.trim() ||
              wishlistItem.image_url?.trim() ||
              wishlistItem.product_image?.trim() ||
              null;

            const productSlug = wishlistItem.slug;

            const viewProduct = () => {
              if (productSlug) {
                profile.router.push(`/product/${productSlug}`);
                return;
              }

              // Safe fallback if slug is unavailable.
              profile.router.push(`/products/${wishlistItem.product_id}`);
            };

            return (
              <article
                key={wishlistItem.product_id}
                className="group min-w-0 rounded-2xl border-[1px] border-[#C9A24B]/20 bg-[linear-gradient(180deg,#141414_0%,#0A0A0A_100%)] p-2 shadow-[inset_0_1px_0_rgba(230,207,146,0.06)] transition-all duration-300 hover:border-[#C9A24B]/50 hover:shadow-[0_0_24px_rgba(201,162,75,0.08)] sm:p-2.5"
              >
                {/* Product Image */}
                <div className="relative overflow-hidden rounded-xl border-[1px] border-[#C9A24B]/30 bg-[#050505]">
                  {image ? (
                    <img
                      src={image}
                      alt={productName}
                      loading="eager"
                      referrerPolicy="no-referrer"
                      className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                      onError={() => {
                        console.error('Wishlist image failed:', image);
                      }}
                    />
                  ) : (
                    <div className="flex aspect-[4/5] items-center justify-center">
                      <ShoppingBag className="h-7 w-7 text-[#C9A24B]/60" strokeWidth={1.4} />
                    </div>
                  )}

                  {/* Image Overlay */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  {/* Remove (heart) Button */}
                  <button
                    type="button"
                    onClick={() => profile.removeFromWishlist(wishlistItem.product_id)}
                    aria-label={`Remove ${productName} from wishlist`}
                    className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full border-[1px] border-[#C9A24B]/50 bg-[#0A0A0A]/80 text-[#E6CF92] backdrop-blur transition-all duration-300 hover:border-[#E6CF92] focus-visible:opacity-100 sm:right-3 sm:top-3 sm:h-10 sm:w-10 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Heart className="h-3.5 w-3.5" fill="currentColor" strokeWidth={1.5} />
                  </button>

                  {/* View Button (desktop hover) */}
                  <button
                    type="button"
                    onClick={viewProduct}
                    className="absolute bottom-3 left-3 right-3 hidden items-center justify-center gap-2 rounded-lg border-[1px] border-[#C9A24B]/60 bg-[#0A0A0A]/85 py-3 text-[10px] uppercase tracking-[0.2em] text-[#F3EBDD] opacity-0 backdrop-blur-sm transition-all duration-500 hover:border-[#E6CF92] hover:text-[#E6CF92] focus-visible:opacity-100 group-hover:opacity-100 sm:flex"
                  >
                    View Piece
                    <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
                  </button>
                </div>

                {/* Product Information */}
                <div className="px-1 pb-1 pt-3">
                  <h3 className="truncate text-[12px] font-medium tracking-[0.02em] text-[#F3EBDD]">
                    {productName}
                  </h3>

                  {wishlistItem.price !== undefined && (
                    <p className="mt-1 text-[13px] font-semibold text-[#E6CF92]">
                      {profile.money(wishlistItem.price)}
                    </p>
                  )}

                  <div className="mt-2 flex items-center justify-between sm:justify-end">
                    {/* Mobile View Action */}
                    <button
                      type="button"
                      onClick={viewProduct}
                      className="inline-flex min-h-[44px] items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-[#E6CF92] transition-colors hover:text-[#F3EBDD] sm:hidden"
                    >
                      View
                      <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
                    </button>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => profile.removeFromWishlist(wishlistItem.product_id)}
                      className="min-h-[44px] px-1 text-[10px] uppercase tracking-[0.16em] text-[#F3EBDD]/45 transition-colors hover:text-red-300 sm:min-h-[32px]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}