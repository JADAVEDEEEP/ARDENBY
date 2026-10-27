'use client';

import { cn } from '@/lib/utils';

import type { SizeFacet } from './shop-filters';

/** 4-column grid of size chips. Selected = ink; sold out = greyed with a diagonal strike. */
export function SizeGrid({
  sizes,
  selected,
  onToggle,
}: {
  sizes: SizeFacet[];
  selected: string[];
  onToggle: (size: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2" role="group" aria-label="Size">
      {sizes.map(({ size, state }) => {
        const on = selected.includes(size);
        const out = state === 'out';
        return (
          <button
            key={size}
            type="button"
            aria-pressed={on}
            aria-label={out ? `${size}, sold out` : state === 'low' ? `${size}, low stock` : size}
            onClick={() => onToggle(size)}
            className={cn(
              'relative h-[38px] overflow-hidden border text-[14px] font-medium transition-colors',
              on
                ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--ivory)]'
                : out
                  ? 'border-[var(--line-2)] text-[var(--soft)]/70 hover:border-[var(--line)]'
                  : 'border-[var(--line)] text-[var(--charcoal)] hover:border-[var(--ink)]'
            )}
          >
            {size}
            {out && !on && (
              <span
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to top right, transparent calc(50% - 0.5px), var(--line) calc(50% - 0.5px), var(--line) calc(50% + 0.5px), transparent calc(50% + 0.5px))',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
