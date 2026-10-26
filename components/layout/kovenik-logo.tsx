/* ---------------------------------------------------------------------------
 *  KOVENIK logo: inline SVG so the CSS animation runs (an <img> would freeze it).
 *  The eyes blink every 4.5s and the pupils glance left and right on a 7s loop.
 *  Both animations are switched off under prefers-reduced-motion.
 *  Size it with `className`, e.g. "h-[46px] w-[184px]" (viewBox is 256 x 64).
 * ------------------------------------------------------------------------- */

export type KovenikLogoLayout = 'stacked' | 'horizontal';

type KovenikLogoProps = {
  /** Kept for call-site compatibility; there is a single artwork. */
  layout?: KovenikLogoLayout;
  className?: string;
};

const LOGO_CSS = `
.kv-eyes{transform-box:fill-box;transform-origin:center;animation:kvblink 4.5s infinite}
@keyframes kvblink{0%,90%,100%{transform:scaleY(1)}93%{transform:scaleY(.1)}96%{transform:scaleY(1)}}
.kv-pupils{animation:kvlook 7s ease-in-out infinite}
@keyframes kvlook{0%,35%,100%{transform:translateX(0)}45%,55%{transform:translateX(-2.5px)}65%,75%{transform:translateX(2.5px)}}
@media (prefers-reduced-motion:reduce){.kv-eyes,.kv-pupils{animation:none}}
`;

export function KovenikLogo({ className }: KovenikLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 64"
      role="img"
      aria-label="KOVENIK"
      className={className}
    >
      <style>{LOGO_CSS}</style>
      <path d="M10 60V26L6 4L24 15Q32 13 40 15L58 4L54 26V60Q32 64 10 60Z" fill="#222222" />
      <g className="kv-eyes">
        <ellipse cx="23" cy="36" rx="7" ry="6" fill="#C9A86A" />
        <ellipse cx="41" cy="36" rx="7" ry="6" fill="#C9A86A" />
        <g className="kv-pupils">
          <ellipse cx="23" cy="36" rx="2" ry="4.6" fill="#222222" />
          <ellipse cx="41" cy="36" rx="2" ry="4.6" fill="#222222" />
        </g>
      </g>
      <path d="M30 46H34L32 49Z" fill="#B08D57" />
      <g fill="none" stroke="#222222" strokeWidth="6" strokeLinecap="square">
        <path d="M78 15V49M98 15L81 32L98 49" />
        <rect x="107" y="15" width="20" height="34" rx="8" />
        <path d="M136 15L146 49L156 15" />
        <path d="M182 15H165V49H182M165 32H179" />
        <path d="M191 49V15L211 49V15" />
        <path d="M220 15V49" />
        <path d="M229 15V49M249 15L232 32L249 49" />
      </g>
      <circle cx="113" cy="6" r="2.6" fill="#B08D57" />
      <circle cx="121" cy="6" r="2.6" fill="#B08D57" />
    </svg>
  );
}
