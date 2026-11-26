'use client';

import Link from 'next/link';
import { ArrowUpDown, ChevronDown, SlidersHorizontal, X } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { GridDensity } from './ProductGrid';
import { SORT_OPTIONS, type SortKey } from './shop-filters';

export type FilterChip = { key: string; label: string; remove: () => void };

export function Breadcrumb({ current }: { current: string }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-[var(--soft)] lg:text-[14px]">
      <Link href="/" className="hover:text-[var(--ink)]">
        Home
      </Link>
      <span aria-hidden>/</span>
      <Link href="/shop" className="hover:text-[var(--ink)]">
        Shop
      </Link>
      {current.trim() && (
        <>
          <span aria-hidden>/</span>
          <span aria-current="page" className="text-[var(--ink)]">
            {current}
          </span>
        </>
      )}
    </nav>
  );
}

function DensityIcon({ cols }: { cols: 3 | 4 }) {
  const size = cols === 4 ? 2 : 3;
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.2">
      {cols === 4 ? (
        <>
          <rect x="1.5" y="1.5" width="5" height="5" />
          <rect x="9.5" y="1.5" width="5" height="5" />
          <rect x="1.5" y="9.5" width="5" height="5" />
          <rect x="9.5" y="9.5" width="5" height="5" />
        </>
      ) : (
        <>
          {[1, 6, 11].flatMap((x) =>
            [1, 6, 11].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width={size + 1} height={size + 1} />)
          )}
        </>
      )}
    </svg>
  );
}

/** Bordered "Sort by <value>" box. A transparent native <select> sits on top so it stays accessible. */
export function SortDropdown({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const current = SORT_OPTIONS.find((o) => o.value === value)?.label ?? 'Relevance';
  return (
    <div className="relative h-11 w-[230px] border border-[var(--line)] bg-transparent focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--ink)]">
      <div aria-hidden className="pointer-events-none flex h-full items-center gap-2 px-4 text-[15px]">
        <span className="text-[var(--soft)]">Sort by</span>
        <span className="flex-1 truncate font-medium text-[var(--ink)]">{current}</span>
        <ChevronDown className="h-4 w-4 text-[var(--ink)]" />
      </div>
      <select
        aria-label="Sort products"
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** One toolbar row above the grid. Desktop: breadcrumb left; "Showing X of Y", density toggle and sort right.
 *  Mobile: breadcrumb and product count on one line. */
export function ListingToolbarRow({
  current,
  shown,
  total,
  density,
  onDensity,
  sort,
  onSort,
}: {
  current: string;
  shown: number;
  total: number;
  density: GridDensity;
  onDensity: (d: GridDensity) => void;
  sort: SortKey;
  onSort: (s: SortKey) => void;
}) {
  return (
    <div className="lg:border-b lg:border-[var(--line)] lg:pb-4">
      {/* Breadcrumb (all sizes) and, on mobile, the product count beside it. */}
      <div className="flex items-center justify-between gap-6">
        <div className="min-w-0">
          <Breadcrumb current={current} />
        </div>
        <p className="shrink-0 text-[13px] text-[var(--soft)] lg:hidden">
          {total} {total === 1 ? 'product' : 'products'}
        </p>
      </div>

      {/* Desktop second row: existing title + count on the left, density and sort on the right. */}
      <div className="mt-3 hidden items-center justify-between gap-6 lg:flex">
        <div className="flex min-w-0 items-baseline gap-3">
          {/* Visual copy of the page's h1 (the real, screen-reader h1 stays in the page). */}
          <p aria-hidden className="truncate text-[22px] font-semibold leading-tight text-[var(--ink)]">
            {current}
          </p>
          <p className="shrink-0 text-[14px] text-[var(--muted)]" aria-live="polite">
            Showing <b className="font-semibold text-[var(--ink)]">{shown}</b> of{' '}
            <b className="font-semibold text-[var(--ink)]">{total}</b> products
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
        <div className="flex items-center gap-1" role="group" aria-label="Grid density">
          {([4, 3] as const).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={density === d}
              aria-label={`${d} columns`}
              onClick={() => onDensity(d)}
              className={cn(
                'flex h-9 w-9 items-center justify-center',
                density === d ? 'text-[var(--ink)]' : 'text-[var(--soft)] hover:text-[var(--ink)]'
              )}
            >
              <DensityIcon cols={d} />
            </button>
          ))}
        </div>
        <SortDropdown value={sort} onChange={onSort} />
        </div>
      </div>
    </div>
  );
}

function ChipButton({ chip }: { chip: FilterChip }) {
  return (
    <button
      type="button"
      onClick={chip.remove}
      aria-label={`Remove filter ${chip.label}`}
      className="inline-flex h-9 shrink-0 items-center gap-2 border border-[var(--line)] px-3 text-[13px] lg:text-[14px] text-[var(--ink)] hover:border-[var(--ink)]"
    >
      {chip.label}
      <X className="h-3 w-3 text-[var(--muted)]" aria-hidden />
    </button>
  );
}

/** Desktop active-filter chips. Renders nothing when no filter is active. */
export function ActiveFilterRow({ chips, onClear }: { chips: FilterChip[]; onClear: () => void }) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {chips.map((c) => (
        <ChipButton key={c.key} chip={c} />
      ))}
      <button type="button" onClick={onClear} className="text-[14px] text-[var(--gold)] underline underline-offset-4">
        Clear all
      </button>
    </div>
  );
}

/** Mobile sticky Filters | Sort bar, directly under the header. */
export function MobileFilterBar({
  activeCount,
  sort,
  onOpenFilters,
  onOpenSort,
}: {
  activeCount: number;
  sort: SortKey;
  onOpenFilters: () => void;
  onOpenSort: () => void;
}) {
  const current = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Relevance';
  return (
    <div className="sticky top-[var(--header-h,161px)] z-30 grid grid-cols-2 border-y border-[var(--line)] bg-[var(--ivory)]">
      <button
        type="button"
        onClick={onOpenFilters}
        aria-haspopup="dialog"
        className="flex h-12 items-center justify-center gap-2 border-r border-[var(--line)] text-[14px] font-semibold text-[var(--ink)]"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        Filters
        {activeCount > 0 && (
          <span
            aria-label={`${activeCount} active`}
            className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--gold)] px-1 text-[10.5px] font-semibold text-white"
          >
            {activeCount}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={onOpenSort}
        aria-haspopup="dialog"
        className="flex h-12 min-w-0 items-center justify-center gap-2 px-2 text-[14px] font-semibold text-[var(--ink)]"
      >
        <ArrowUpDown className="h-4 w-4 shrink-0" aria-hidden />
        Sort
        <span className="min-w-0 truncate text-[14px] font-normal text-[var(--soft)]">{current}</span>
      </button>
    </div>
  );
}

/** Horizontal-scroll row of active chips (mobile). */
export function ChipRow({ chips }: { chips: FilterChip[] }) {
  if (chips.length === 0) return null;
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {chips.map((c) => (
        <ChipButton key={c.key} chip={c} />
      ))}
    </div>
  );
}
