/* Homepage image paths in one place. All point at existing files in /public/images. */

/** Homepage hero photo. Swap the file (same path) to change it; also used as the hero preload. */
export const HERO_IMAGE = '/images/hero-dtf-back-print.jpg';

/** Product photo used by the shop hero when no featured drop is available. */
export const HERO_PRODUCT_IMAGE = '/images/products/kovenik-mahadev-tee.png';

/** Image used when a product has no photo. */
export const PRODUCT_FALLBACK_IMAGE = '/images/KOEVNIK.png';

/** Category tile / collection image. */
export const categoryImage = (slug: string): string =>
  `/images/categories/${slug}.jpg`;
