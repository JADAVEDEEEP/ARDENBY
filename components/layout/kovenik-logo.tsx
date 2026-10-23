'use client';

import { useEffect, useId, useRef } from 'react';
import {
  CREATURE,
  CREATURE_TRANSFORM,
  LETTERS,
  LOGO_ASPECT,
  LOGO_VIEWBOX,
  SWASH,
} from './kovenik-logo-art';

/* ---------------------------------------------------------------------------
 *  KOVENIK logo (horned imp mascot) — single shared layered SVG used by navbar + footer.
 *  Layers (bottom → top): white rim · chrome sticker · graphite imp body ·
 *  gloss · eyes (independent <g> per eye) · graphite lettering · swash.
 *
 *  Eyes: each eye is its own group (.kv-eye-look-l / -r) that translates inside
 *  the imp's face, with a nested element (.kv-eye-blink) that squashes to blink.
 *    - mouse devices: eyes follow the cursor anywhere in the window, rest on leave
 *    - touch / no mouse: autonomous look left/right (CSS), plus periodic blink
 *  Motion styles live in globals.css (.kv-logo3d). Reduced motion = fully static.
 * ------------------------------------------------------------------------- */

export type KovenikLogoLayout = 'stacked' | 'horizontal';

type KovenikLogoProps = {
  /** Kept for call-site compatibility; the artwork is the same in both places. */
  layout?: KovenikLogoLayout;
  className?: string;
};

const MAX_TILT = 9; // degrees
const EYE_RANGE_X = 10; // svg units the eyes can travel sideways
const EYE_RANGE_Y = 5;

const clamp = (v: number) => Math.min(1, Math.max(-1, v));

export function KovenikLogo({ className }: KovenikLogoProps) {
  const root = useRef<HTMLSpanElement>(null);
  const uid = useId().replace(/:/g, '');
  const id = (n: string) => `kv${n}${uid}`;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;

    const setEyes = (nx: number, ny: number) => {
      el.style.setProperty('--kv-ex-l', String(nx * EYE_RANGE_X));
      el.style.setProperty('--kv-ex-r', String(nx * EYE_RANGE_X * 0.92));
      el.style.setProperty('--kv-ey', String(ny * EYE_RANGE_Y));
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || reduce.matches) return;
      const { clientX, clientY } = e;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        if (r.width === 0) return; // hidden breakpoint variant
        el.dataset.look = 'follow';
        setEyes(
          clamp((clientX - (r.left + r.width / 2)) / 220),
          clamp((clientY - (r.top + r.height / 2)) / 160),
        );
      });
    };
    const onLeaveWindow = () => {
      cancelAnimationFrame(frame);
      if (el.dataset.look === 'follow') setEyes(0, 0);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeaveWindow);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeaveWindow);
    };
  }, []);

  /* 3D tilt — mouse over the logo only */
  const tiltFrame = useRef(0);
  const tilt = (rx: number, ry: number, sx: number, active: boolean) => {
    const el = root.current;
    if (!el) return;
    el.style.setProperty('--kv-rx', `${rx}deg`);
    el.style.setProperty('--kv-ry', `${ry}deg`);
    el.style.setProperty('--kv-sx', `${sx}%`);
    el.dataset.active = active ? 'true' : 'false';
  };
  const onTiltMove = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (e.pointerType !== 'mouse') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = root.current;
    if (!el) return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(tiltFrame.current);
    tiltFrame.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const px = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
      const py = Math.min(1, Math.max(0, (clientY - r.top) / r.height));
      tilt((0.5 - py) * 2 * MAX_TILT, (px - 0.5) * 2 * MAX_TILT, 120 - px * 140, true);
    });
  };
  const onTiltLeave = () => {
    cancelAnimationFrame(tiltFrame.current);
    tilt(0, 0, 0, false);
  };

  return (
    <span
      ref={root}
      className={`kv-logo3d ${className ?? ''}`}
      style={{ aspectRatio: LOGO_ASPECT }}
      data-active="false"
      data-look="auto"
      onPointerMove={onTiltMove}
      onPointerLeave={onTiltLeave}
    >
      <span className="kv-logo3d-tilt">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={LOGO_VIEWBOX}
          role="img"
          aria-label="Kovenik"
          className="kv-logo3d-img"
        >
          <defs>
            {/* horizon-line chrome for the sticker shape */}
            <linearGradient id={id('chrome')} gradientUnits="userSpaceOnUse" x1="0" y1="30" x2="0" y2="500">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.26" stopColor="#e8ecf1" />
              <stop offset="0.45" stopColor="#aab1ba" />
              <stop offset="0.5" stopColor="#5f656e" />
              <stop offset="0.55" stopColor="#c3c9d0" />
              <stop offset="0.8" stopColor="#eef1f4" />
              <stop offset="1" stopColor="#a4abb4" />
            </linearGradient>
            {/* dark graphite for body + lettering */}
            <linearGradient id={id('graphite')} gradientUnits="userSpaceOnUse" x1="0" y1="110" x2="0" y2="440">
              <stop offset="0" stopColor="#40434a" />
              <stop offset="0.45" stopColor="#17181c" />
              <stop offset="1" stopColor="#2c2e34" />
            </linearGradient>
            {/* imp body: polished graphite, silver rim-light on the right */}
            <linearGradient id={id('body')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4b4e56" />
              <stop offset="0.5" stopColor="#1b1c20" />
              <stop offset="1" stopColor="#0d0d0f" />
            </linearGradient>
            <linearGradient id={id('shade')} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0.6" stopColor="#c3c9d0" stopOpacity="0" />
              <stop offset="1" stopColor="#c3c9d0" stopOpacity="0.28" />
            </linearGradient>
            <linearGradient id={id('socket')} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.6" stopColor="#dfe3e8" />
              <stop offset="1" stopColor="#9aa1aa" />
            </linearGradient>
            <linearGradient id={id('gloss')} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <clipPath id={id('creatureclip')}>
              <path d={CREATURE} />
            </clipPath>
          </defs>

          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* outline layers: white rim, then chrome */}
            <g stroke="#f7f9fb" fill="#f7f9fb" strokeWidth="140">
              <path transform={CREATURE_TRANSFORM} d={CREATURE} />
              {LETTERS.map((l, i) => <path key={i} transform={l.t} d={l.d} />)}
              <path d={SWASH} />
            </g>
            <g stroke={`url(#${id('chrome')})`} fill={`url(#${id('chrome')})`} strokeWidth="126">
              <path transform={CREATURE_TRANSFORM} d={CREATURE} />
              {LETTERS.map((l, i) => <path key={i} transform={l.t} d={l.d} />)}
              <path d={SWASH} />
            </g>

            {/* imp body */}
            <g transform={CREATURE_TRANSFORM}>
              <path d={CREATURE} fill={`url(#${id('body')})`} />
              <g clipPath={`url(#${id('creatureclip')})`}>
                <path d={CREATURE} fill={`url(#${id('shade')})`} stroke="none" />
                <path d="M 58 70 C 70 40 96 30 120 34 C 92 50 78 84 74 124 C 58 112 52 92 58 70 Z" fill={`url(#${id('gloss')})`} opacity="0.55" stroke="none" />
              </g>
              <path d={CREATURE} stroke="#c3c9d0" strokeWidth="4" />
              {/* scheming brows */}
              <path d="M 66 100 L 118 120" stroke="#c3c9d0" strokeWidth="9" />
              <path d="M 196 104 L 144 124" stroke="#c3c9d0" strokeWidth="9" />
              {/* eyes — independent groups; wide left, squinting right */}
              <g className="kv-eye-look kv-eye-look-l">
                <g className="kv-eye-blink">
                  <ellipse cx="92" cy="146" rx="21" ry="26" fill={`url(#${id('socket')})`} stroke="none" />
                  <ellipse cx="97" cy="150" rx="9" ry="13" fill="#0b0b0d" stroke="none" />
                  <circle cx="100" cy="145" r="3" fill="#fff" stroke="none" />
                </g>
              </g>
              <g className="kv-eye-look kv-eye-look-r">
                <g className="kv-eye-blink">
                  <ellipse cx="168" cy="150" rx="20" ry="17" fill={`url(#${id('socket')})`} stroke="none" />
                  <ellipse cx="173" cy="152" rx="8" ry="9" fill="#0b0b0d" stroke="none" />
                  <circle cx="175" cy="149" r="2.6" fill="#fff" stroke="none" />
                </g>
              </g>
              {/* lopsided fanged grin */}
              <path d="M 76 200 C 104 244 160 246 190 194 C 164 214 108 214 76 200 Z" fill="#050506" stroke="#c3c9d0" strokeWidth="3" />
              <path d="M 98 211 L 106 230 L 114 214 Z M 150 214 L 158 230 L 166 211 Z" fill="#f7f9fb" stroke="none" />
            </g>

            {/* lettering + swash */}
            <g stroke={`url(#${id('graphite')})`} strokeWidth="44">
              {LETTERS.map((l, i) => <path key={i} transform={l.t} d={l.d} />)}
            </g>
            <g stroke="#f7f9fb" strokeWidth="5" opacity="0.2" transform="translate(-8,-8)">
              {LETTERS.map((l, i) => <path key={i} transform={l.t} d={l.d} />)}
            </g>
            <path d={SWASH} stroke={`url(#${id('graphite')})`} strokeWidth="12" />
          </g>
        </svg>
        <span className="kv-logo3d-sheen" aria-hidden="true" />
      </span>
    </span>
  );
}
