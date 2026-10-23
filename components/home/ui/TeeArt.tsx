import { useId } from 'react';

export type TeeVariant = 'black' | 'sand' | 'graphite';
export type TeeSide = 'front' | 'back';

const PALETTE: Record<TeeVariant, { light: string; mid: string; dark: string; ink: string }> = {
  black: { light: '#50545b', mid: '#202328', dark: '#08090b', ink: '#f4f6f8' },
  sand: { light: '#efe3cb', mid: '#d3c1a1', dark: '#a8956f', ink: '#1b1b1b' },
  graphite: { light: '#6b7078', mid: '#3d4147', dark: '#1a1c20', ink: '#f1f3f5' },
};

const BODY_FRONT =
  'M155 38 L84 64 Q50 78 20 126 L56 188 L92 164 L90 408 Q200 420 310 408 L308 164 L344 188 L380 126 Q350 78 316 64 L245 38 Q200 80 155 38 Z';
const BODY_BACK =
  'M155 38 L84 64 Q50 78 20 126 L56 188 L92 164 L90 408 Q200 420 310 408 L308 164 L344 188 L380 126 Q350 78 316 64 L245 38 Q200 54 155 38 Z';

interface TeeArtProps {
  variant?: TeeVariant;
  side?: TeeSide;
  className?: string;
}

/** Shaded SVG oversized drop-shoulder tee. Stand-in for a transparent product
 *  cut-out: no background, so it can float, rotate and reflect on the stage. */
export function TeeArt({ variant = 'black', side = 'front', className }: TeeArtProps) {
  const uid = useId().replace(/:/g, '');
  const c = PALETTE[variant];
  const body = side === 'front' ? BODY_FRONT : BODY_BACK;
  const fill = `url(#fill-${uid})`;

  return (
    <svg
      viewBox="0 0 400 440"
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c.light} />
          <stop offset="0.5" stopColor={c.mid} />
          <stop offset="1" stopColor={c.dark} />
        </linearGradient>
        <linearGradient id={`edge-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.55" />
          <stop offset="0.16" stopColor="#000" stopOpacity="0" />
          <stop offset="0.84" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.6" />
        </linearGradient>
        <radialGradient id={`sheen-${uid}`} cx="0.32" cy="0.2" r="0.6">
          <stop offset="0" stopColor="#fff" stopOpacity="0.34" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`hem-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.8" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.45" />
        </linearGradient>
        <clipPath id={`clip-${uid}`}>
          <path d={body} />
        </clipPath>
      </defs>

      <path d={body} fill={fill} />
      {/* Chrome rim light on the silhouette */}
      <path d={body} stroke="#fff" strokeOpacity="0.3" strokeWidth="1.6" strokeLinejoin="round" />
      <g clipPath={`url(#clip-${uid})`}>
        <rect width="400" height="440" fill={`url(#edge-${uid})`} />
        <rect width="400" height="440" fill={`url(#sheen-${uid})`} />
        <rect width="400" height="440" fill={`url(#hem-${uid})`} />
        {/* Fabric folds */}
        <path d="M120 170 Q150 260 128 400" stroke="#fff" strokeOpacity="0.07" strokeWidth="14" />
        <path d="M262 190 Q238 280 270 404" stroke="#000" strokeOpacity="0.22" strokeWidth="16" />
        <path d="M56 188 L92 164" stroke="#000" strokeOpacity="0.4" strokeWidth="3" />
        <path d="M344 188 L308 164" stroke="#000" strokeOpacity="0.4" strokeWidth="3" />
        {/* Hem stitch */}
        <path d="M92 396 Q200 408 308 396" stroke="#fff" strokeOpacity="0.16" strokeDasharray="3 4" />
      </g>

      {/* Collar rib */}
      {side === 'front' ? (
        <>
          <path d="M155 38 Q200 80 245 38" stroke={c.dark} strokeWidth="9" strokeLinecap="round" />
          <path d="M158 41 Q200 80 242 41" stroke="#fff" strokeOpacity="0.2" strokeWidth="1.5" />
        </>
      ) : (
        <>
          <path d="M155 38 Q200 54 245 38" stroke={c.dark} strokeWidth="9" strokeLinecap="round" />
          <path d="M158 41 Q200 56 242 41" stroke="#fff" strokeOpacity="0.2" strokeWidth="1.5" />
        </>
      )}

      {side === 'front' ? (
        <text
          x="262"
          y="124"
          textAnchor="middle"
          fill={c.ink}
          fillOpacity="0.92"
          fontSize="13"
          letterSpacing="4"
          style={{ fontFamily: 'var(--font-bodoni), Didot, serif' }}
        >
          KOVENIK
        </text>
      ) : (
        <g fill={c.ink} stroke={c.ink}>
          <circle cx="200" cy="205" r="62" fill="none" strokeOpacity="0.9" strokeWidth="2" />
          <circle cx="200" cy="205" r="48" fill="none" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="2 5" />
          <path d="M170 225 L200 168 L230 225 Z" fillOpacity="0.9" stroke="none" />
          <text
            x="200"
            y="300"
            textAnchor="middle"
            fontSize="30"
            letterSpacing="9"
            stroke="none"
            style={{ fontFamily: 'var(--font-bodoni), Didot, serif' }}
          >
            KOVENIK
          </text>
          <text
            x="200"
            y="322"
            textAnchor="middle"
            fontSize="9"
            letterSpacing="6"
            stroke="none"
            fillOpacity="0.7"
            style={{ fontFamily: 'var(--font-archivo), Arial, sans-serif' }}
          >
            WEAR YOUR ESSENCE
          </text>
        </g>
      )}
    </svg>
  );
}
