'use client';

import Image from 'next/image';

import { motion, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { MoveHorizontal } from 'lucide-react';

import { TeeSpinner } from '@/components/product/TeeSpinner';

import { HERO_LOOKBOOK_IMAGE } from './home-assets';

interface HeroStageProps {
  alt: string;
  /** Featured-drop product faces (same image as the Shop hero). */
  front: string;
  back: string;
  printLabel: string;
  /** Normalised pointer position (-0.5..0.5) for the parallax layers. */
  px: MotionValue<number>;
  py: MotionValue<number>;
}

/** Floating product in a polished chrome orbital ring: glass sheets, perspective
 *  floor, mirrored reflection, hotspots, and the shared 360 degree TeeSpinner
 *  (front/back faces, auto-spin, drag to rotate). */
export function HeroStage({ alt, front, back, printLabel, px, py }: HeroStageProps) {
  const reduce = useReducedMotion();
  // Parallax: ring, product and glass sheets sit at different depths (max 20px).
  const sx = useSpring(px, { stiffness: 60, damping: 18 });
  const sy = useSpring(py, { stiffness: 60, damping: 18 });
  const ringX = useTransform(sx, [-0.5, 0.5], [7, -7]);
  const ringY = useTransform(sy, [-0.5, 0.5], [5, -5]);
  const productX = useTransform(sx, [-0.5, 0.5], [-14, 14]);
  const productY = useTransform(sy, [-0.5, 0.5], [-10, 10]);
  const sheetX = useTransform(sx, [-0.5, 0.5], [20, -20]);
  const sheetY = useTransform(sy, [-0.5, 0.5], [8, -8]);
  const tagX = useTransform(sx, [-0.5, 0.5], [-6, 6]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px] lg:h-[640px] lg:max-w-none">
      {/* Perspective floor grid, soft floor glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[-6%] bottom-0 h-[34%] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,#000_30%,#000_70%,transparent)]"
      >
        <div className="chrome-grid-floor absolute inset-x-[-10%] top-0 h-[260%]" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[10%] bottom-[5%] h-[16%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,255,255,0.5),rgba(255,255,255,0.12)_55%,transparent)] blur-[2px]"
      />

      {/* Angled glass sheets (perspective + rotateY +-35deg) */}
      <motion.div
        aria-hidden="true"
        style={{ x: reduce ? 0 : sheetX, y: reduce ? 0 : sheetY }}
        className="pointer-events-none absolute inset-0 [perspective:1200px]"
      >
        <div
          className="chrome-glass absolute bottom-[12%] left-[0%] top-[10%] w-[32%] rounded-xl"
          style={{ transform: 'rotateY(35deg)', transformOrigin: 'left center' }}
        />
        <div
          className="chrome-glass absolute bottom-[12%] right-[0%] top-[16%] w-[30%] rounded-xl"
          style={{ transform: 'rotateY(-35deg)', transformOrigin: 'right center' }}
        />
      </motion.div>

      {/* Chrome ring + dashed ring + highlight arc + orbiting sphere */}
      <motion.div
        aria-hidden="true"
        style={{ x: reduce ? 0 : ringX, y: reduce ? 0 : ringY }}
        className="pointer-events-none absolute inset-[5%]"
      >
        <svg viewBox="0 0 600 600" className="absolute inset-0 h-full w-full overflow-visible" fill="none">
          <defs>
            <linearGradient id="kv-ring" x1="0.1" y1="0" x2="0.9" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.22" stopColor="#8a9098" />
              <stop offset="0.42" stopColor="#f4f6f8" />
              <stop offset="0.62" stopColor="#4a4f56" />
              <stop offset="0.82" stopColor="#dfe3e8" />
              <stop offset="1" stopColor="#7b818a" />
            </linearGradient>
            <filter id="kv-ring-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>
          <circle cx="300" cy="300" r="276" stroke="rgba(255,255,255,0.25)" strokeWidth="14" filter="url(#kv-ring-glow)" />
          <circle cx="300" cy="300" r="276" stroke="url(#kv-ring)" strokeWidth="6" />
          <circle cx="300" cy="300" r="294" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="4 9" />
          <path
            d="M 96 150 A 276 276 0 0 1 250 28"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <div className="kv-orbit absolute inset-0" style={{ ['--kv-d' as string]: '14s' }}>
          <span className="absolute left-1/2 top-[2.1%] h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff,#9ba1a9_55%,#34373c)] shadow-[0_0_18px_4px_rgba(255,255,255,0.5)]" />
        </div>
      </motion.div>

      {/* Product: parallax -> float -> perspective -> drag tilt */}
      <motion.div
        style={{ x: reduce ? 0 : productX, y: reduce ? 0 : productY }}
        className="absolute inset-[11%]"
      >
        <div
          role="img"
          aria-label={`${alt}. Drag horizontally to rotate.`}
          className="relative h-full w-full"
        >
          <TeeSpinner front={front} back={back} printLabel={printLabel} className="absolute inset-0" />
          {/* Mirrored, faded reflection on the polished floor */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-[96%] h-[45%] -scale-y-100 opacity-25 [mask-image:linear-gradient(to_top,#000,transparent_70%)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={front} alt="" className="h-full w-full object-contain object-bottom" />
          </div>
        </div>
      </motion.div>

      {/* Contact shadow */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[26%] bottom-[11%] h-5 rounded-[50%] bg-[radial-gradient(closest-side,rgba(0,0,0,0.75),transparent)]"
      />

      {/* Hotspot tags + leader lines */}
      <motion.div
        style={{ x: reduce ? 0 : tagX }}
        className="pointer-events-none absolute inset-0 hidden sm:block"
      >
        <div className="absolute bottom-[17%] left-[-4%] flex items-center lg:left-[-8%]">
          <div className="chrome-glass rounded-xl px-3.5 py-2">
            <p className="text-[12px] font-bold uppercase tracking-wider text-white">240 GSM</p>
            <p className="text-[10px] text-kv-muted">Engineered cotton</p>
          </div>
          <span className="h-px w-12 bg-gradient-to-r from-white/70 to-white/30" />
          <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.7)]" />
        </div>

        <div className="absolute right-[-3%] top-[7%] flex flex-row-reverse items-center lg:right-[-6%]">
          <div className="chrome-glass rounded-xl px-3.5 py-2">
            <p className="text-[12px] font-bold uppercase tracking-wider text-white">Drop shoulder</p>
            <p className="text-[10px] text-kv-muted">Relaxed oversized cut</p>
          </div>
          <span className="h-px w-12 bg-gradient-to-l from-white/70 to-white/30" />
          <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_10px_2px_rgba(255,255,255,0.7)]" />
        </div>
      </motion.div>

      {/* Drag hint */}
      <div className="chrome-glass pointer-events-none absolute bottom-[-1%] left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
        <MoveHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
        Drag to rotate
      </div>

      {/* Small glass lookbook card (the model photo lives here, not on the stage) */}
      <div className="chrome-glass absolute bottom-[3%] right-[-1%] hidden w-[170px] overflow-hidden rounded-2xl p-1.5 shadow-[0_24px_50px_-18px_rgba(0,0,0,0.9)] sm:block lg:right-[-4%] lg:w-[190px]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
          <Image
            src={HERO_LOOKBOOK_IMAGE}
            alt="Kovenik lookbook, model wearing the new collection"
            fill
            sizes="190px"
            className="object-cover"
          />
        </div>
        <div className="flex items-center justify-between px-1.5 pb-1 pt-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white">Lookbook</p>
            <p className="text-[10px] text-kv-muted">On model</p>
          </div>
          <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
        </div>
      </div>
    </div>
  );
}
