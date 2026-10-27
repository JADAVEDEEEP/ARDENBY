'use client';

import { useEffect, useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

import { BottomSheet } from './BottomSheet';
import {
  GROUPS,
  GroupBody,
  groupActive,
  groupHasOptions,
  type CategoryOption,
  type GroupId,
} from './FilterGroups';
import { EMPTY_FILTERS, applyFilters, buildFacets, type ShopFilters } from './shop-filters';

/** Filter sheet with a group rail on the left. Edits a local draft; the URL only changes on "Show N results". */
export function MobileFilterSheet({
  open,
  onOpenChange,
  products,
  applied,
  categories,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: any[];
  applied: ShopFilters;
  categories: CategoryOption[];
  onApply: (filters: ShopFilters) => void;
}) {
  const [draft, setDraft] = useState<ShopFilters>(applied);
  const [group, setGroup] = useState<GroupId>('category');

  useEffect(() => {
    if (open) {
      setDraft(applied);
      setGroup('category');
    }
    // Re-seed only when the sheet opens, not on every URL change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const facets = useMemo(() => buildFacets(products, draft.category), [products, draft.category]);
  const count = useMemo(() => applyFilters(products, draft).length, [products, draft]);
  const groups = GROUPS.filter((g) => groupHasOptions(g.id, facets));
  const active = groups.find((g) => g.id === group) ?? groups[0];

  const clear = () => setDraft({ ...EMPTY_FILTERS, sort: draft.sort });

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filters"
      fixedHeight
      headerAction={
        <button type="button" onClick={clear} className="text-[13px] text-[var(--gold)] underline underline-offset-4">
          Clear all
        </button>
      }
      footer={
        <div className="grid grid-cols-[1fr_1.7fr] gap-3">
          <button
            type="button"
            onClick={clear}
            className="h-12 border border-[var(--ink)] text-[14px] font-semibold uppercase tracking-[0.14em] text-[var(--ink)]"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(draft);
              onOpenChange(false);
            }}
            className="h-12 bg-[var(--ink)] text-[14px] font-semibold uppercase tracking-[0.14em] text-[var(--ivory)]"
          >
            Show {count} {count === 1 ? 'result' : 'results'}
          </button>
        </div>
      }
    >
      <div className="flex min-h-0 flex-1">
        <div role="tablist" aria-orientation="vertical" aria-label="Filter groups" className="w-[132px] shrink-0 overflow-y-auto border-r border-[var(--line)] bg-[var(--ivory-2)]">
          {groups.map((g) => {
            const on = g.id === active.id;
            return (
              <button
                key={g.id}
                type="button"
                role="tab"
                id={`kvl-tab-${g.id}`}
                aria-selected={on}
                aria-controls="kvl-filter-pane"
                onClick={() => setGroup(g.id)}
                className={cn(
                  'relative flex h-[46px] w-full items-center justify-between px-5 text-left text-[15px]',
                  on ? 'bg-[var(--ivory)] font-semibold text-[var(--ink)]' : 'text-[var(--charcoal)]'
                )}
              >
                {on && <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-[var(--ink)]" />}
                {g.railLabel}
                {groupActive(g.id, draft) && (
                  <span aria-label="has selection" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                )}
              </button>
            );
          })}
        </div>
        <div
          id="kvl-filter-pane"
          role="tabpanel"
          aria-labelledby={`kvl-tab-${active.id}`}
          className="min-w-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 pt-5"
        >
          <p className="kvl-eyebrow mb-3 !text-[11px] text-[var(--soft)]">{active.label}</p>
          <GroupBody
            id={active.id}
            filters={draft}
            facets={facets}
            categories={categories}
            onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
          />
        </div>
      </div>
    </BottomSheet>
  );
}
