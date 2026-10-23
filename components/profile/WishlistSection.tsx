'use client';

import type { useProfile } from '../../hooks/use-profile';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { EmptyPanel, SectionTitle } from './metal';

type ProfileState = ReturnType<typeof useProfile>;

export function WishlistSection({ profile }: { profile: ProfileState }) {
  const wishlistCount = profile.wishlist.length;

  return (
    <section>
      <SectionTitle
        label="KOVENIK — SAVED PIECES"
        title="Wishlist"
        sub={
          wishlistCount > 0
            ? `${wishlistCount} ${wishlistCount === 1 ? 'piece' : 'pieces'} saved`
            : "Pieces you've chosen to keep close."
        }
        action={
          wishlistCount > 0 && (
            <button type="button" onClick={() => profile.clearWishlist()} className="kv-btn-ghost">
              <Trash2 className="h-3.5 w-3.5" /> Clear wishlist
            </button>
          )
        }
      />

      {wishlistCount === 0 ? (
        <EmptyPanel
          icon={Heart}
          title="Nothing saved yet"
          text="Save pieces you love and they will appear here."
          action={
            <button type="button" onClick={() => profile.router.push('/shop')} className="kv-btn-primary">
              Explore Collection <ArrowRight className="h-4 w-4" />
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
          {profile.wishlist.map((item) => {
            // Backend wishlist response: primary_image, slug, name, product_id, price
            const w = item as typeof item & { primary_image?: string; slug?: string };
            const productName = w.product_name || w.name || 'KOVENIK Product';
            const image = w.primary_image?.trim() || w.image_url?.trim() || w.product_image?.trim() || null;

            const viewProduct = () =>
              profile.router.push(w.slug ? `/product/${w.slug}` : `/products/${w.product_id}`);

            return (
              <article key={w.product_id} className="kv-inner group relative min-w-0 overflow-hidden">
                <button type="button" onClick={viewProduct} className="block w-full text-left" aria-label={`View ${productName}`}>
                  <span className="flex aspect-[4/5] w-full items-center justify-center overflow-hidden border-b border-[#2c2e34] bg-[radial-gradient(circle_at_50%_30%,#2e3036,#141518)]">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt={productName}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <ShoppingBag className="h-7 w-7 text-[#9296A0]" strokeWidth={1.5} />
                    )}
                  </span>
                  <span className="block px-3 pb-3 pt-3 sm:px-4">
                    <span title={productName} className="line-clamp-2 min-h-[38px] break-words text-[13px] font-medium leading-[19px] text-white">
                      {productName}
                    </span>
                    {w.price !== undefined && w.price !== null && (
                      <span className="mt-1 block text-[15px] font-semibold tabular-nums text-white">
                        {profile.money(w.price)}
                      </span>
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => profile.removeFromWishlist(w.product_id)}
                  aria-label={`Remove ${productName} from wishlist`}
                  className="kv-disc absolute right-3 top-3 h-11 w-11 transition hover:brightness-125"
                >
                  <Heart className="h-4 w-4 fill-[#EF7B7B] text-[#EF7B7B]" strokeWidth={1.7} />
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
