'use client';

import { cn } from '@/lib/utils';

import type { ColourFacet } from './shop-filters';

/** 2-column list of 20px circular swatches with names. Selected = ink ring with an ivory gap. */
export function ColourSwatches({
  colors,
  selected,
  onToggle,
}: {
  colors: ColourFacet[];
  selected: string[];
  onToggle: (key: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1" role="group" aria-label="Colour">
      {colors.map((c) => {
        const on = selected.includes(c.key);
        return (
          <button
            key={c.key}
            type="button"
            aria-pressed={on}
            aria-label={c.label}
            onClick={() => onToggle(c.key)}
            className="flex min-h-[38px] items-center gap-3 text-left"
          >
            <span
              aria-hidden
              className={cn(
                'h-5 w-5 shrink-0 rounded-full border border-black/15',
                on && 'border-transparent shadow-[0_0_0_2px_var(--ivory),0_0_0_3.5px_var(--ink)]'
              )}
              style={{ backgroundColor: c.hex }}
            />
            <span className={cn('truncate text-[14px] text-[var(--charcoal)]', on && 'font-semibold text-[var(--ink)]')}>
              {c.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
