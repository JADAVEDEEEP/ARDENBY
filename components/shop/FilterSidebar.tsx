'use client';

import { useEffect, useRef, useState } from 'react';

import { FilterGroup } from './FilterGroup';
import { GROUPS, GroupBody, groupHasOptions, type CategoryOption, type FilterPatch } from './FilterGroups';
import type { Facets, ShopFilters } from './shop-filters';

const GAP_TOP = 16;
const GAP_BOTTOM = 24;

/** Offset for the sticky filter column.
 *  - Content fits under the header: pin it just below the header.
 *  - Content is taller than the viewport: "sticky to bottom" (top = 100vh - content - 24px), so the page scrolls
 *    through the filters naturally (nothing is hidden behind an inner scrollbar) and the last group stays
 *    pinned once reached.
 *  Content height is observed, so expanding / collapsing groups switches modes without a jump. */
function useStickyTop(ref: React.RefObject<HTMLElement>) {
  const [height, setHeight] = useState(0);
  const [headerH, setHeaderH] = useState(125);
  const [vh, setVh] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const header = document.querySelector<HTMLElement>('body header');
    const read = () => {
      setHeight(el.offsetHeight);
      setVh(window.innerHeight);
      if (header) setHeaderH(Math.round(header.getBoundingClientRect().height));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    if (header) ro.observe(header);
    window.addEventListener('resize', read);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', read);
    };
  }, [ref]);

  const fits = height === 0 || vh === 0 || height <= vh - headerH - GAP_TOP - GAP_BOTTOM;
  return fits ? `calc(var(--header-h, ${headerH}px) + ${GAP_TOP}px)` : `calc(100vh - ${height}px - ${GAP_BOTTOM}px)`;
}

/** Desktop filter column (265px). The aside stretches to the full row height and carries the continuous right
 *  border; the inner wrapper is the sticky part. No inner scrolling, no fixed heights: every filter stays reachable
 *  by scrolling the page. */
export function FilterSidebar({
  filters,
  facets,
  categories,
  onChange,
  onClear,
  hasActive,
}: {
  filters: ShopFilters;
  facets: Facets;
  categories: CategoryOption[];
  onChange: (patch: FilterPatch) => void;
  onClear: () => void;
  hasActive: boolean;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const top = useStickyTop(innerRef);

  return (
    <aside aria-label="Filters" className="relative z-0 hidden border-r border-[var(--line)] lg:block">
      <div ref={innerRef} className="sticky self-start pb-8 pl-6 pr-5 pt-6" style={{ top }}>
        <div className="flex items-center justify-between border-b border-[var(--line-2)] pb-4">
          <h2 className="kvl-eyebrow text-[15px] text-[var(--ink)]">Filters</h2>
          <button
            type="button"
            onClick={onClear}
            disabled={!hasActive}
            className="text-[14px] text-[var(--gold)] underline underline-offset-4 disabled:opacity-50"
          >
            Clear all
          </button>
        </div>
        {GROUPS.filter((g) => groupHasOptions(g.id, facets)).map((g) => (
          <FilterGroup key={g.id} title={g.label} defaultOpen={g.defaultOpen}>
            <GroupBody id={g.id} filters={filters} facets={facets} categories={categories} onChange={onChange} />
          </FilterGroup>
        ))}
      </div>
    </aside>
  );
}
