'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { ColourFacet } from './shop-filters';

/** Circle fill: one colour, or a diagonal split for two-tone colours. Shared with the product cards. */
export const swatchBackground = (hex: string, hex2?: string) =>
  hex2 ? `linear-gradient(135deg, ${hex} 0 50%, ${hex2} 50% 100%)` : hex;

/** Colour search (when there are many colours), then one row per colour: swatch, full name, count on the right.
 *  Selected = ink ring with an ivory gap. A colour no product in view has is disabled. */
export function ColourSwatches({
  colors,
  selected,
  onToggle,
}: {
  colors: ColourFacet[];
  selected: string[];
  onToggle: (key: string) => void;
}) {
  const [term, setTerm] = useState('');
  const showSearch = colors.length > 6;
  const q = term.trim().toLowerCase();
  const shown = q ? colors.filter((c) => c.label.toLowerCase().includes(q)) : colors;

  return (
    <div role="group" aria-label="Colour">
      {showSearch && (
        <label className="mb-2 flex h-10 items-center gap-2 border border-[var(--line)] px-3 focus-within:border-[var(--ink)]">
          <Search className="h-4 w-4 shrink-0 text-[var(--soft)]" aria-hidden />
          <input
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search for colour"
            aria-label="Search colours"
            className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--soft)]"
          />
        </label>
      )}
      {shown.length === 0 && <p className="py-2 text-[14px] text-[var(--soft)]">No colour matches.</p>}
      <div className="max-h-[300px] overflow-y-auto pr-1 kv-thin-scroll">
        {shown.map((c) => {
          const on = selected.includes(c.key);
          const empty = c.count === 0 && !on;
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={on}
              aria-label={empty ? `${c.label}, none available` : c.label}
              disabled={empty}
              onClick={() => onToggle(c.key)}
              className={cn('flex min-h-[36px] w-full items-center gap-3 py-1 text-left', empty && 'cursor-not-allowed opacity-40')}
            >
              <span
                aria-hidden
                className={cn(
                  'h-5 w-5 shrink-0 rounded-full border border-black/20',
                  on && 'border-transparent shadow-[0_0_0_2px_var(--ivory),0_0_0_3.5px_var(--ink)]'
                )}
                style={{ background: swatchBackground(c.hex, c.hex2) }}
              />
              {/* Full name, wrapping onto a second line rather than being cut off. */}
              <span className={cn('min-w-0 flex-1 break-words text-[14px] leading-tight text-[var(--charcoal)]', on && 'font-semibold text-[var(--ink)]')}>
                {c.label}
              </span>
              <span className="text-[13px] tabular-nums text-[var(--soft)]">{c.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
