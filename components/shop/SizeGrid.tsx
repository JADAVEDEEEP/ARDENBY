'use client';

import { cn } from '@/lib/utils';

import type { SizeFacet } from './shop-filters';

/** Rounded size chips with the number of products carrying that size. Selected = ink; sold out = greyed with a diagonal strike. */
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
    <div className="flex flex-wrap gap-2" role="group" aria-label="Size">
      {sizes.map(({ size, state, carrying }) => {
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
              'relative inline-flex h-[36px] items-center gap-1 overflow-hidden rounded-full border px-3.5 text-[14px] font-medium transition-colors',
              on
                ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--ivory)]'
                : out
                  ? 'border-[var(--line-2)] text-[var(--soft)]/70 hover:border-[var(--line)]'
                  : 'border-[var(--line)] text-[var(--charcoal)] hover:border-[var(--ink)]'
            )}
          >
            {size}
            <span className={cn('text-[11px] font-normal tabular-nums', on ? 'text-[var(--ivory)]/75' : 'text-[var(--soft)]')}>({carrying})</span>
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
