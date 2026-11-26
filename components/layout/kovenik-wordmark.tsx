/**
 * The one KOVENIK logo: the supplied artwork (/kovenik-wordmark.png, 2880x800, transparent).
 * Used as-is: only the height is set, width stays auto, so it is never stretched, cropped or filtered.
 * Every place that shows the logo (header, mobile menu, footer, login, admin, 404) renders this.
 * The PNG has transparent padding around the letters, so the visible lettering is roughly 70% of `height`.
 */
const HEIGHTS = { sm: 44, md: 56, lg: 72 } as const;

export function KovenikWordmark({
  size = 'md',
  height,
  className,
}: {
  size?: keyof typeof HEIGHTS;
  /** Overrides `size` with an exact pixel height (must stay at or below 800). */
  height?: number;
  className?: string;
}) {
  const h = Math.min(height ?? HEIGHTS[size], 800);
  // Pre-scaled copies (Lanczos) for the header sizes so the artwork stays crisp instead of being squeezed down by the browser.
  const sharp = h === 44 || h === 56;
  return (
    // Plain <img> on purpose: next/image would re-encode and resize the artwork.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sharp ? `/kovenik-wordmark-h${h}.png` : '/kovenik-wordmark.png'}
      srcSet={sharp ? `/kovenik-wordmark-h${h}.png 1x, /kovenik-wordmark-h${h * 2}.png 2x, /kovenik-wordmark-h${h * 3}.png 3x` : undefined}
      alt="KOVENIK"
      height={h}
      style={{ height: h, width: 'auto', maxWidth: 'none' }}
      className={className ? `block ${className}` : 'block'}
      draggable={false}
    />
  );
}
