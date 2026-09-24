'use client';

import type { useProfile } from '../../hooks/use-profile';

import {
  Heart,
  ShoppingBag,
  Trash2,
  ArrowUpRight,
} from 'lucide-react';

import { EmptyState, Panel } from './ui';

type ProfileState = ReturnType<typeof useProfile>;

export function WishlistSection({
  profile,
}: {
  profile: ProfileState;
}) {
  const wishlistCount = profile.wishlist.length;

  return (
    <Panel
      title="Wishlist"
      subtitle="Pieces you've chosen to keep close."
    >
      {/* Header */}
      {wishlistCount > 0 && (
        <div className="mb-8 flex items-end justify-between border-b border-black/10 pb-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#8A8177]">
              Saved Pieces
            </p>

            <p className="mt-1 text-sm text-[#2F2B27]">
              {wishlistCount}{' '}
              {wishlistCount === 1 ? 'piece' : 'pieces'} saved
            </p>
          </div>

          <button
            type="button"
            onClick={() => profile.clearWishlist()}
            className="group inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.18em] text-[#6F685F] transition-colors duration-300 hover:text-black"
          >
            <Trash2 className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-90" />
            Clear Wishlist
          </button>
        </div>
      )}

      {/* Empty State */}
      {wishlistCount === 0 ? (
        <div className="border border-black/8 bg-[#F8F6F2]">
          <EmptyState
            icon={Heart}
            title="Nothing saved yet"
            text="Save pieces you love and they will appear here."
            action="Explore Collection"
            onAction={() => profile.router.push('/')}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
          {profile.wishlist.map((item) => {
            /*
             * Backend wishlist response contains:
             * primary_image
             * slug
             * name
             * product_id
             * price
             */

            const wishlistItem = item as typeof item & {
              primary_image?: string;
              slug?: string;
            };

            const productName =
              wishlistItem.product_name ||
              wishlistItem.name ||
              'ARDENBY Product';

            const image =
              wishlistItem.primary_image?.trim() ||
              wishlistItem.image_url?.trim() ||
              wishlistItem.product_image?.trim() ||
              null;

            const productSlug = wishlistItem.slug;

            const viewProduct = () => {
              if (productSlug) {
                profile.router.push(
                  `/product/${productSlug}`
                );
                return;
              }

              // Safe fallback if slug is unavailable.
              profile.router.push(
                `/products/${wishlistItem.product_id}`
              );
            };

            return (
              <article
                key={wishlistItem.product_id}
                className="group min-w-0"
              >
                {/* Product Image */}
                <div className="relative overflow-hidden bg-[#ECE8E0]">
                  {image ? (
                    <img
                      src={image}
                      alt={productName}
                      loading="eager"
                      referrerPolicy="no-referrer"
                      className="aspect-[4/5] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                      onError={() => {
                        console.error(
                          'Wishlist image failed:',
                          image
                        );
                      }}
                    />
                  ) : (
                    <div className="flex aspect-[4/5] items-center justify-center">
                      <ShoppingBag className="h-7 w-7 text-[#A0988E]" />
                    </div>
                  )}

                  {/* Image Overlay */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() =>
                      profile.removeFromWishlist(
                        wishlistItem.product_id
                      )
                    }
                    aria-label={`Remove ${productName} from wishlist`}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#302C28] shadow-sm opacity-100 transition-all duration-300 hover:bg-black hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Heart
                      className="h-3.5 w-3.5"
                      fill="currentColor"
                      strokeWidth={1.5}
                    />
                  </button>

                  {/* View Button */}
                  <button
                    type="button"
                    onClick={viewProduct}
                    className="absolute bottom-3 left-3 right-3 hidden items-center justify-center gap-2 bg-white/95 py-3 text-[9px] uppercase tracking-[0.2em] text-[#211F1C] opacity-0 backdrop-blur-sm transition-all duration-500 group-hover:opacity-100 sm:flex"
                  >
                    View Piece

                    <ArrowUpRight
                      className="h-3 w-3"
                      strokeWidth={1.5}
                    />
                  </button>
                </div>

                {/* Product Information */}
                <div className="pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[11px] font-medium uppercase tracking-[0.04em] text-[#24211E]">
                        {productName}
                      </h3>

                      {wishlistItem.price !== undefined && (
                        <p className="mt-1.5 text-[11px] text-[#71695F]">
                          {profile.money(
                            wishlistItem.price
                          )}
                        </p>
                      )}
                    </div>

                    <Heart
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#24211E]"
                      fill="currentColor"
                      strokeWidth={1.5}
                    />
                  </div>

                  {/* Mobile View Action */}
                  <button
                    type="button"
                    onClick={viewProduct}
                    className="mt-4 inline-flex items-center gap-1.5 border-b border-black/30 pb-1 text-[9px] uppercase tracking-[0.17em] text-[#38332E] transition-colors hover:border-black hover:text-black sm:hidden"
                  >
                    View Piece

                    <ArrowUpRight
                      className="h-3 w-3"
                      strokeWidth={1.5}
                    />
                  </button>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() =>
                      profile.removeFromWishlist(
                        wishlistItem.product_id
                      )
                    }
                    className="mt-4 ml-4 text-[9px] uppercase tracking-[0.17em] text-[#9A9288] transition-colors hover:text-black sm:ml-0"
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </Panel>
  );
}