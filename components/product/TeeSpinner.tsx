'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

/* Photos with an opaque black backdrop: make that backdrop transparent.
   Flood-fills near-black pixels connected to the image border (so the black
   print inside the tee is kept) and feathers the edge. Falls back to the
   original URL if the image can't be read (CORS) or anything fails. */
const cutoutCache = new Map<string, string>();

export function useCutout(src: string) {
  const [out, setOut] = useState<string>(cutoutCache.get(src) ?? src);

  useEffect(() => {
    const cached = cutoutCache.get(src);
    if (cached) {
      setOut(cached);
      return;
    }
    setOut(src);
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const scale = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h);
        const px = data.data;
        const DARK = 38;
        const isBg = (i: number) =>
          px[i + 3] < 10 || (px[i] < DARK && px[i + 1] < DARK && px[i + 2] < DARK);

        const removed = new Uint8Array(w * h);
        const stack = new Int32Array(w * h);
        let sp = 0;
        const seed = (x: number, y: number) => {
          const p = y * w + x;
          if (!removed[p] && isBg(p * 4)) {
            removed[p] = 1;
            stack[sp++] = p;
          }
        };
        for (let x = 0; x < w; x++) {
          seed(x, 0);
          seed(x, h - 1);
        }
        for (let y = 0; y < h; y++) {
          seed(0, y);
          seed(w - 1, y);
        }
        while (sp > 0) {
          const p = stack[--sp];
          const x = p % w;
          const y = (p - x) / w;
          if (x > 0) seed(x - 1, y);
          if (x < w - 1) seed(x + 1, y);
          if (y > 0) seed(x, y - 1);
          if (y < h - 1) seed(x, y + 1);
        }

        // Feather: dark anti-aliased fringe next to the removed area.
        const alpha = new Uint8ClampedArray(w * h);
        for (let p = 0; p < w * h; p++) {
          if (removed[p]) {
            alpha[p] = 0;
            continue;
          }
          const x = p % w;
          const y = (p - x) / w;
          const nearBg =
            (x > 0 && removed[p - 1]) ||
            (x < w - 1 && removed[p + 1]) ||
            (y > 0 && removed[p - w]) ||
            (y < h - 1 && removed[p + w]);
          const i = p * 4;
          const maxc = Math.max(px[i], px[i + 1], px[i + 2]);
          alpha[p] = nearBg ? Math.max(0, Math.min(255, ((maxc - DARK) / 70) * 255)) : px[i + 3];
        }
        for (let p = 0; p < w * h; p++) px[p * 4 + 3] = alpha[p];
        ctx.putImageData(data, 0, 0);

        canvas.toBlob((blob) => {
          if (!blob || cancelled) return;
          const url = URL.createObjectURL(blob);
          cutoutCache.set(src, url);
          setOut(url);
        }, 'image/png');
      } catch (e) {
        // Tainted canvas (no CORS) etc.: keep the original image.
        console.warn('[shop] hero cutout skipped', e);
      }
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return out;
}

/** The 360 degree spinning tee (front/back faces, auto-spin, drag to rotate).
 *  Shared by the Shop hero and the Home hero. */
export function TeeSpinner({
  front,
  back,
  printLabel,
  paused = false,
  className = 'absolute inset-x-[9%] bottom-[12%] top-[6%]',
  onDraggingChange,
}: {
  front: string;
  back: string;
  printLabel: string;
  paused?: boolean;
  className?: string;
  onDraggingChange?: (dragging: boolean) => void;
}) {
  const [drag, setDrag] = useState<number | null>(null);
  const startRef = useRef<{ x: number; base: number } | null>(null);
  const frontSrc = useCutout(front);
  const backSrc = useCutout(back);

  const end = () => {
    startRef.current = null;
    setDrag(null);
    onDraggingChange?.(false);
  };

  return (
    <div
      className={cn('kv-tee-stage touch-pan-y', (paused || drag !== null) && 'kv-tee-paused', className)}
      onPointerDown={(e) => {
        startRef.current = { x: e.clientX, base: drag ?? -14 };
        setDrag(-14);
        onDraggingChange?.(true);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!startRef.current) return;
        setDrag(startRef.current.base + (e.clientX - startRef.current.x) * 0.6);
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div className="kv-tee-float h-full w-full">
        <div
          className="kv-tee-spin relative h-full w-full"
          style={drag !== null ? { animation: 'none', transform: `rotateY(${drag}deg)` } : undefined}
        >
          <div className="kv-tee-face">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={frontSrc}
              alt={`${printLabel} tee, front`}
              draggable={false}
              className="h-full w-full select-none object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,.6)]"
            />
          </div>
          <div className="kv-tee-face kv-tee-back">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={backSrc}
              alt={`${printLabel} tee, back`}
              draggable={false}
              className="h-full w-full select-none object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,.6)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
