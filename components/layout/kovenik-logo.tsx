/* ---------------------------------------------------------------------------
 *  KOVENIK logo: a bold black wordmark with a small Rebel Bunny peeking out from
 *  behind the last letters (ears and eyes above the letters, paws gripping the top edge).
 *  Palette: black #111111, white #FFFFFF, red #E53935. Static inline SVG, no animation.
 *  Size it with `className`, e.g. "h-[46px] w-[131px]" (viewBox is 182 x 64).
 *  The svg is overflow:visible so the ear tips can rise a few px above the box
 *  without changing layout.
 * ------------------------------------------------------------------------- */

export type KovenikLogoLayout = 'stacked' | 'horizontal';

type KovenikLogoProps = {
  /** Kept for call-site compatibility; there is a single artwork. */
  layout?: KovenikLogoLayout;
  className?: string;
  /** false drops the bunny and shows the wordmark only. */
  bunny?: boolean;
};

const BLACK = '#111111';
const WHITE = '#FFFFFF';
const RED = '#E53935';

export function KovenikLogo({ className, bunny = true }: KovenikLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 182 64"
      role="img"
      aria-label="KOVENIK"
      className={className}
      style={{ overflow: 'visible' }}
    >
      {/* Bunny head + ears sit behind the letters. */}
      {bunny && (
        <g stroke={BLACK} strokeWidth="2.2" strokeLinejoin="round">
          <g transform="rotate(-10 143 18)">
            <rect x="139" y="0" width="8" height="19" rx="4" fill={WHITE} />
            <rect x="141.2" y="3" width="3.6" height="11.5" rx="1.8" fill={RED} stroke="none" />
          </g>
          <g transform="rotate(12 159 18)">
            <rect x="155" y="0" width="8" height="19" rx="4" fill={WHITE} />
            <rect x="157.2" y="3" width="3.6" height="11.5" rx="1.8" fill={RED} stroke="none" />
          </g>
          <ellipse cx="151" cy="26" rx="14" ry="10" fill={WHITE} />
          {/* Eyes, with a slanted brow for the rebel attitude. */}
          <circle cx="145.5" cy="25" r="1.9" fill={BLACK} stroke="none" />
          <circle cx="156.5" cy="25" r="1.9" fill={BLACK} stroke="none" />
          <path d="M142 20.5L148 22.5M160 20.5L154 22.5" fill="none" stroke={RED} strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}
      <text
        x="0"
        y="53"
        textLength="182"
        lengthAdjust="spacingAndGlyphs"
        fill={BLACK}
        fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
        fontSize="38"
        fontWeight="900"
      >
        KOVENIK
      </text>
      <rect x="0" y="57" width="44" height="3" rx="1.5" fill={RED} />
      {/* Paws gripping the top edge of the letters. */}
      {bunny && (
        <g fill={WHITE} stroke={BLACK} strokeWidth="2">
          <ellipse cx="143" cy="33" rx="4" ry="3" />
          <ellipse cx="159" cy="33" rx="4" ry="3" />
        </g>
      )}
    </svg>
  );
}
