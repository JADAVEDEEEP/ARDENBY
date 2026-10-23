/* ---------------------------------------------------------------------------
 *  Homepage visual assets in ONE place so they are easy to swap later.
 *  Everything below currently points at existing files in /public/images.
 *  Replacement asset spec lives in the final hand-off notes.
 * ------------------------------------------------------------------------- */

/** Hero stage product, one per hero slide (index matches `heroSlides`).
 *  Ideal: transparent PNG of a tee/hoodie floating, ~1200x1400. */
export const HERO_STAGE_IMAGES = [
  '/images/hero-linen.png',
  '/images/hero-dtf-back-print.png',
  '/images/hero-olive-graphic.png',
] as const;

/** Hero stage product: transparent PNG cut-out, also used on the Crafted pedestal. */
export const HERO_PRODUCT_IMAGE = '/images/products/kovenik-mahadev-tee.png';

/** Small glass "Lookbook" card in the hero. Ideal: portrait model photo. */
export const HERO_LOOKBOOK_IMAGE = '/images/hero-black-tee.jpg';

/** Product shown on the chrome pedestal in the Crafted section.
 *  Ideal: transparent PNG of a black tee, ~1000x1200. */
export const PEDESTAL_PRODUCT_IMAGE = '/images/hero-dtf-back-print.png';

/** Image used when a product has no photo. */
export const PRODUCT_FALLBACK_IMAGE = '/images/KOEVNIK.png';

/** Story image used by the Crafted section video thumbnail. Already used by
 *  the previous homepage, kept as-is (external, no new hotlinks added). */
export const PROCESS_STORY_IMAGE =
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1400&q=80';

/** Category tile / collection image. Ideal: transparent product cut-out. */
export const categoryImage = (slug: string): string =>
  `/images/categories/${slug}.jpg`;
