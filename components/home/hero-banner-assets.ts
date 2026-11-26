import type { PublicBanner } from '@/lib/banner-api';

/**
 * Layered-hero artwork for the live banners, matched by banner name (the API does not carry these fields yet).
 * `bg*` are text-free backgrounds, `model*` are transparent cut-outs of the same size, so the giant KOVENIK word
 * can sit between them. A banner the API already sends a `modelImageUrl` for always wins over this table.
 */
type Entry = { bg: string; bgMobile: string; model: string; modelMobile: string; title: string; subtitle: string; buttonText: string };

const art = (slug: string) => ({
  bg: `/images/hero/${slug}-desktop-bg.jpg`,
  bgMobile: `/images/hero/${slug}-mobile-bg.jpg`,
  model: `/images/hero/${slug}-desktop-model.png`,
  modelMobile: `/images/hero/${slug}-mobile-model.png`,
});

const LOCAL: Record<string, Entry> = {
  'exclusive-offers': { ...art('exclusive-offers'), title: 'Exclusive Offers', subtitle: 'Special offers. Free shipping over ₹999.', buttonText: 'Shop the offers' },
  'new-collection': { ...art('new-collection'), title: 'New Collection', subtitle: 'Discover the latest KOVENIK streetwear.', buttonText: 'Shop the collection' },
  'best-sellers': { ...art('best-sellers'), title: 'Best Sellers', subtitle: 'Pieces everyone keeps coming back for.', buttonText: 'Shop best sellers' },
  'limited-time-sale': { ...art('limited-time-sale'), title: 'Limited Time Sale', subtitle: 'Grab your favourites before they are gone.', buttonText: 'Shop the sale' },
  'premium-streetwear': { ...art('premium-streetwear'), title: 'Premium Streetwear', subtitle: 'Elevated essentials. KOVENIK Premium.', buttonText: 'Explore Premium' },
};

const slugify = (name: string) => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Adds the layered-hero fields to a banner when local artwork exists for it. */
export function withHeroArt(banner: PublicBanner): PublicBanner {
  const entry = LOCAL[slugify(banner.name)];
  if (!entry || banner.modelImageUrl) return banner;
  return {
    ...banner,
    imageUrl: entry.bg,
    mobileImageUrl: entry.bgMobile,
    modelImageUrl: entry.model,
    mobileModelImageUrl: entry.modelMobile,
    title: banner.title ?? entry.title,
    subtitle: banner.subtitle ?? entry.subtitle,
    buttonText: banner.buttonText ?? entry.buttonText,
  };
}
