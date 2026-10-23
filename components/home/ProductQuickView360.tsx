'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { PointerEvent, RefObject } from 'react';
import { createPortal } from 'react-dom';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  AnimatePresence,
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
} from 'framer-motion';
import { MoveHorizontal, ShoppingBag, X } from 'lucide-react';
import { toast } from 'sonner';

import { discountPercent, formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart-store';
import type { Product, ProductSize } from '@/types';

import { ProductImage } from './ui/ProductImage';

const AUTO_DEG_PER_MS = 360 / 14000;
const DRAG_DEG_PER_PX = 0.6;
const FRICTION = 0.0035;
const FRAME_PX = 7; // pointer travel per frame in frame-sequence mode

export type Viewer360Mode = 'frames' | 'flip' | 'turntable';

/** Which 360 experience a product gets. */
export function viewerMode(product: Product): Viewer360Mode {
  if (product.frames360 && product.frames360.length >= 8) return 'frames';
  if (product.backImage || (product.images?.length ?? 0) >= 2) return 'flip';
  return 'turntable';
}

const HINT =
  'chrome-glass pointer-events-none absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white';

/* ---------------------------------------------------------------- viewers */

/** Shared drag-with-inertia rotation. Returns the motion value + handlers. */
function useSpin(autoDegPerMs: number) {
  const reduce = useReducedMotion();
  const angle = useMotionValue(0);
  const drag = useRef<{ x: number; base: number; lastX: number; lastT: number; v: number } | null>(null);
  const velocity = useRef(0);
  const resumeAt = useRef(0);
  const last = useRef(0);
  const [grabbing, setGrabbing] = useState(false);

  useAnimationFrame(() => {
    const now = performance.now();
    const dt = Math.min(now - (last.current || now), 250);
    last.current = now;
    if (drag.current) return;
    if (Math.abs(velocity.current) > 0.0006) {
      angle.set(angle.get() + velocity.current * dt);
      velocity.current *= Math.exp(-FRICTION * dt);
    } else if (!reduce && now > resumeAt.current) {
      angle.set(angle.get() + autoDegPerMs * dt);
    }
  });

  const handlers = {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      velocity.current = 0;
      drag.current = { x: e.clientX, base: angle.get(), lastX: e.clientX, lastT: performance.now(), v: 0 };
      setGrabbing(true);
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const d = drag.current;
      if (!d) return;
      const now = performance.now();
      const dt = Math.max(1, now - d.lastT);
      d.v = ((e.clientX - d.lastX) * DRAG_DEG_PER_PX) / dt;
      d.lastX = e.clientX;
      d.lastT = now;
      angle.set(d.base + (e.clientX - d.x) * DRAG_DEG_PER_PX);
    },
    onPointerUp: () => {
      const d = drag.current;
      if (d) velocity.current = Math.max(-1.2, Math.min(1.2, d.v));
      drag.current = null;
      resumeAt.current = performance.now() + 1500; // let it coast, then spin again
      setGrabbing(false);
    },
  };

  return { angle, handlers: { ...handlers, onPointerCancel: handlers.onPointerUp }, grabbing };
}

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-full min-h-[320px] w-full overflow-hidden rounded-2xl border border-white/[0.14] bg-[radial-gradient(70%_50%_at_50%_92%,rgba(255,255,255,0.14),transparent_70%),linear-gradient(180deg,#1c1e22,#08090a)]">
      {/* floor glow + grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[10%] bottom-[6%] h-[12%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,255,255,0.45),transparent)]"
      />
      {children}
    </div>
  );
}

/** Mode 2: front + back faces turning in 3D. */
function FlipViewer({ front, back, name }: { front: string; back: string; name: string }) {
  const { angle, handlers, grabbing } = useSpin(AUTO_DEG_PER_MS);

  return (
    <Stage>
      <div
        role="img"
        aria-label={`${name}. Drag horizontally to rotate 360 degrees.`}
        {...handlers}
        className={cn(
          'absolute inset-0 touch-pan-y select-none [perspective:1200px]',
          grabbing ? 'cursor-grabbing' : 'cursor-grab'
        )}
      >
        <motion.div
          style={{ rotateY: angle }}
          className="absolute inset-x-[8%] bottom-[12%] top-[6%] [transform-style:preserve-3d]"
        >
          <div className="kv-face">
            <ProductImage src={front} alt={name} sizes="480px" />
          </div>
          <div className="kv-face kv-face-back">
            <ProductImage src={back} alt="" sizes="480px" />
          </div>
        </motion.div>
      </div>
      <div className={HINT}>
        <MoveHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
        Drag to rotate 360°
      </div>
    </Stage>
  );
}

/** Mode 1: a real frame sequence scrubbed by dragging, auto-spinning when idle. */
function FramesViewer({ frames, name }: { frames: string[]; name: string }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const drag = useRef<{ x: number; base: number } | null>(null);
  const resumeAt = useRef(0);
  const [grabbing, setGrabbing] = useState(false);

  useEffect(() => {
    frames.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, [frames]);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      if (!drag.current && performance.now() > resumeAt.current) {
        setIndex((i) => (i + 1) % frames.length);
      }
    }, 14000 / frames.length);
    return () => window.clearInterval(id);
  }, [frames.length, reduce]);

  const mod = (n: number) => ((n % frames.length) + frames.length) % frames.length;

  return (
    <Stage>
      <div
        role="img"
        aria-label={`${name}. Drag horizontally to rotate 360 degrees.`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, base: index };
          setGrabbing(true);
        }}
        onPointerMove={(e) => {
          if (drag.current) setIndex(mod(drag.current.base + Math.round((e.clientX - drag.current.x) / FRAME_PX)));
        }}
        onPointerUp={() => {
          drag.current = null;
          resumeAt.current = performance.now() + 2000;
          setGrabbing(false);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setGrabbing(false);
        }}
        className={cn('absolute inset-0 touch-pan-y select-none', grabbing ? 'cursor-grabbing' : 'cursor-grab')}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={frames[index]}
          alt=""
          draggable={false}
          className="absolute inset-x-[8%] bottom-[12%] top-[6%] h-[82%] w-[84%] object-contain drop-shadow-[0_24px_24px_rgba(0,0,0,0.6)]"
        />
      </div>
      <div className={HINT}>
        <MoveHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
        Drag to rotate 360°
      </div>
    </Stage>
  );
}

/** Mode 3: single image on a swaying turntable with a floor reflection. */
function TurntableViewer({ src, name }: { src: string; name: string }) {
  const reduce = useReducedMotion();
  return (
    <Stage>
      <motion.div
        animate={reduce ? undefined : { rotateY: [-25, 25, -25] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 [perspective:1200px]"
      >
        <div className="absolute inset-x-[10%] bottom-[24%] top-[6%]">
          <ProductImage src={src} alt={name} sizes="480px" />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[10%] top-[76%] h-[20%] -scale-y-100 opacity-25 [mask-image:linear-gradient(to_top,#000,transparent_80%)]"
        >
          <ProductImage src={src} alt="" sizes="480px" />
        </div>
      </motion.div>
      <div className={HINT}>360° view coming soon</div>
    </Stage>
  );
}

/* ------------------------------------------------------------------ modal */

interface ProductQuickView360Props {
  product: Product;
  open: boolean;
  onClose: () => void;
  /** Element to focus again when the dialog closes (the Quick View button). */
  returnFocusRef?: RefObject<HTMLElement>;
}

export function ProductQuickView360({ product, open, onClose, returnFocusRef }: ProductQuickView360Props) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();

  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();
  const [addStatus, setAddStatus] = useState<'idle' | 'adding' | 'added'>('idle');

  const [selected, setSelected] = useState(0);
  const [size, setSize] = useState<ProductSize | null>(product.sizes?.[0] ?? null);

  useEffect(() => setMounted(true), []);

  // Scroll lock, Esc, focus trap, focus restore.
  useEffect(() => {
    if (!open || !mounted) return;
    const trigger = returnFocusRef?.current ?? (document.activeElement as HTMLElement | null);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );
    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);

    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      trigger?.focus();
    };
  }, [open, mounted, returnFocusRef]);

  if (!mounted) return null;

  const images = product.images ?? [];
  const mode = viewerMode(product);
  const front = images[selected] ?? images[0] ?? '';
  const back =
    selected === 0 && product.backImage
      ? product.backImage
      : images[(selected + 1) % Math.max(images.length, 1)] ?? front;

  const price = Number(product.price) || 0;
  const mrp = Number(product.mrp) || 0;
  const bestPrice = Number(product.bestPrice) || 0;
  const discount = mrp > price ? discountPercent(mrp, price) : 0;

  const handleAdd = async () => {
    if (addStatus !== 'idle') return;
    const variants = product.variants ?? [];
    const variant =
      variants.find((v) => v.size === size && v.inventory > 0) ??
      (size ? undefined : variants.find((v) => v.inventory > 0));

    if (!variant?.id) {
      toast.error(variants.length ? 'That size is currently unavailable.' : 'Please pick options on the full details page.');
      return;
    }

    setAddStatus('adding');
    const added = await addItem({
      productId: product.id,
      variantId: variant.id,
      slug: product.slug,
      name: product.name,
      image: images[0],
      size: variant.size,
      color: variant.color,
      price: product.price,
      mrp: product.mrp,
    });
    if (!added) {
      setAddStatus('idle');
      return;
    }
    setAddStatus('added');
    onClose();
    router.push('/cart');
  };

  return createPortal(
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="qv"
            className="fixed inset-0 z-[9950] flex items-end justify-center md:items-center md:p-6"
            // React bubbles portal events to the card; keep its tilt out of the dialog.
            onPointerMove={(e) => e.stopPropagation()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              aria-label="Close quick view"
              tabIndex={-1}
              onClick={onClose}
              className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm"
            />

            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={{ opacity: 0, scale: 0.94, y: 28 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="chrome-scope chrome-glass relative z-10 grid h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-[#0b0c0e]/95 p-4 text-kv-body md:h-auto md:max-h-[90vh] md:max-w-[960px] md:grid-cols-[1.1fr_1fr] md:gap-8 md:rounded-3xl md:p-6"
              style={{ fontFamily: 'var(--font-archivo), Inter, Arial, sans-serif' }}
            >
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="chrome-focus chrome-glass absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:border-white/50"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Viewer */}
              <div className="flex min-w-0 flex-col gap-3">
                <div className="aspect-[4/4.4] w-full md:aspect-auto md:h-[520px]">
                  {mode === 'frames' && <FramesViewer frames={product.frames360 as string[]} name={product.name} />}
                  {mode === 'flip' && <FlipViewer key={`${front}|${back}`} front={front} back={back} name={product.name} />}
                  {mode === 'turntable' && <TurntableViewer src={images[0] ?? ''} name={product.name} />}
                </div>

                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto" role="group" aria-label="Product images">
                    {images.slice(0, 6).map((src, i) => (
                      <button
                        key={src + i}
                        type="button"
                        onClick={() => setSelected(i)}
                        aria-label={`Show image ${i + 1}`}
                        aria-pressed={selected === i}
                        className={cn(
                          'chrome-focus relative h-16 w-14 shrink-0 overflow-hidden rounded-lg border transition',
                          selected === i ? 'border-white' : 'border-white/20 opacity-70 hover:opacity-100'
                        )}
                      >
                        <Image src={src} alt="" fill sizes="56px" className="object-cover object-top" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex min-w-0 flex-col pb-6 pt-5 md:pb-0 md:pt-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-kv-gold">Quick view · 360°</p>
                <h2
                  id={titleId}
                  className="chrome-text mt-2 font-bodoni text-[clamp(26px,3vw,36px)] font-medium uppercase leading-[1.05]"
                >
                  {product.name}
                </h2>

                <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-[26px] font-bold leading-none text-white">{formatINR(price)}</span>
                  {mrp > price && (
                    <span className="text-[14px] leading-none text-kv-muted line-through">{formatINR(mrp)}</span>
                  )}
                  {discount > 0 && (
                    <span className="rounded-full border border-white/30 bg-gradient-to-b from-white/30 to-white/10 px-2.5 py-1 text-[10px] font-bold uppercase leading-none tracking-wider text-white">
                      {discount}% off
                    </span>
                  )}
                </div>
                {bestPrice > 0 && bestPrice < price && (
                  <p className="mt-2 text-[13px] text-kv-muted">
                    Best Price <span className="font-semibold text-white">{formatINR(bestPrice)}</span>
                  </p>
                )}

                {product.sizes?.length > 0 && (
                  <div className="mt-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white">Select size</p>
                    <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Size">
                      {product.sizes.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSize(s)}
                          aria-pressed={size === s}
                          className={cn(
                            'chrome-focus min-h-[44px] min-w-[48px] rounded-full border px-4 text-[12px] font-semibold uppercase tracking-wider transition',
                            size === s
                              ? 'border-transparent bg-[linear-gradient(180deg,#ffffff,#c9ced5)] text-[#0b0c0e]'
                              : 'border-white/25 text-kv-body hover:border-white/60 hover:text-white'
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-7 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={addStatus !== 'idle'}
                    aria-busy={addStatus === 'adding'}
                    className="chrome-focus gold-fill gold-sheen group inline-flex min-h-[48px] flex-1 items-center justify-center gap-2.5 rounded-full px-7 text-[12px] font-bold uppercase tracking-[0.16em] shadow-[0_10px_28px_-10px_rgba(201,162,74,0.65)] transition hover:brightness-110"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    {addStatus === 'adding' ? 'Adding…' : addStatus === 'added' ? 'Added' : 'Add to cart'}
                  </button>
                </div>

                <Link
                  href={`/product/${product.slug}`}
                  className="chrome-focus mt-5 inline-flex min-h-[44px] items-center self-start text-[11px] font-semibold uppercase tracking-[0.18em] text-white underline underline-offset-[6px] transition hover:text-kv-gold"
                >
                  View full details
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body
  );
}
