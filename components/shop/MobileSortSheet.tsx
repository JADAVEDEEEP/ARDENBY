'use client';

import * as RadioGroup from '@radix-ui/react-radio-group';

import { BottomSheet } from './BottomSheet';
import { SORT_OPTIONS, type SortKey } from './shop-filters';

/** Single-select sort sheet. Picking an option applies it and closes the sheet. */
export function MobileSortSheet({
  open,
  onOpenChange,
  value,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: SortKey;
  onSelect: (sort: SortKey) => void;
}) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Sort by">
      <RadioGroup.Root
        value={value}
        aria-label="Sort by"
        onValueChange={(v) => {
          onSelect(v as SortKey);
          onOpenChange(false);
        }}
        className="px-5 pb-[max(12px,env(safe-area-inset-bottom))]"
      >
        {SORT_OPTIONS.map((o) => (
          <RadioGroup.Item
            key={o.value}
            value={o.value}
            className="group flex h-[52px] w-full items-center justify-between border-b border-[var(--line-2)] text-left text-[16px] text-[var(--charcoal)] last:border-b-0 data-[state=checked]:font-semibold data-[state=checked]:text-[var(--ink)]"
          >
            {o.label}
            <span
              aria-hidden
              className="flex h-[22px] w-[22px] items-center justify-center rounded-full border border-[var(--line)] group-data-[state=checked]:border-[var(--ink)]"
            >
              <RadioGroup.Indicator className="h-3 w-3 rounded-full bg-[var(--ink)]" />
            </span>
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </BottomSheet>
  );
}
