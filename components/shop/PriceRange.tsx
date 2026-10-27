'use client';

import { useEffect, useState } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

const STEP = 50;

/** Dual-handle slider + ₹ min / ₹ max inputs. Commits on release / blur, so
 *  dragging doesn't write to the URL on every pixel. `null` means "no bound". */
export function PriceRange({
  min,
  max,
  bound,
  onChange,
}: {
  min: number | null;
  max: number | null;
  bound: number;
  onChange: (min: number | null, max: number | null) => void;
}) {
  const [draft, setDraft] = useState<[number, number]>([min ?? 0, max ?? bound]);
  const [lo, setLo] = useState(String(min ?? 0));
  const [hi, setHi] = useState(String(max ?? bound));

  useEffect(() => {
    setDraft([min ?? 0, max ?? bound]);
    setLo(String(min ?? 0));
    setHi(String(max ?? bound));
  }, [min, max, bound]);

  const commit = (a: number, b: number) => {
    const low = Math.max(0, Math.min(a, b));
    const high = Math.min(bound, Math.max(a, b));
    onChange(low <= 0 ? null : low, high >= bound ? null : high);
  };

  const thumb =
    'block h-[18px] w-[18px] rounded-full border-[1.5px] border-[var(--ink)] bg-[var(--ivory)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ivory)]';

  const field = (which: 'min' | 'max') => (
    <label className="flex h-11 min-w-0 flex-1 items-center gap-1.5 border border-[var(--line)] px-3 text-[15px] text-[var(--ink)] focus-within:border-[var(--ink)]">
      <span className="text-[var(--soft)]" aria-hidden>
        ₹
      </span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={bound}
        aria-label={which === 'min' ? 'Minimum price' : 'Maximum price'}
        value={which === 'min' ? lo : hi}
        onChange={(e) => (which === 'min' ? setLo(e.target.value) : setHi(e.target.value))}
        onBlur={() => commit(Number(lo) || 0, hi === '' ? bound : Number(hi))}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="w-full min-w-0 bg-transparent outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
    </label>
  );

  return (
    <div>
      <SliderPrimitive.Root
        value={draft}
        min={0}
        max={bound}
        step={STEP}
        minStepsBetweenThumbs={1}
        onValueChange={(v) => {
          setDraft([v[0], v[1]]);
          setLo(String(v[0]));
          setHi(String(v[1]));
        }}
        onValueCommit={(v) => commit(v[0], v[1])}
        className="relative flex h-6 w-full touch-none select-none items-center px-[9px]"
      >
        <SliderPrimitive.Track className="relative h-px w-full grow bg-[var(--line)]">
          <SliderPrimitive.Range className="absolute h-[2px] -translate-y-1/2 bg-[var(--ink)]" style={{ top: '50%' }} />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb aria-label="Minimum price" className={thumb} />
        <SliderPrimitive.Thumb aria-label="Maximum price" className={thumb} />
      </SliderPrimitive.Root>
      <div className="mt-3 flex items-center gap-3">
        {field('min')}
        <span aria-hidden className="text-[var(--soft)]">
          –
        </span>
        {field('max')}
      </div>
    </div>
  );
}
