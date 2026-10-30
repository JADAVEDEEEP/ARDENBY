'use client';

import { Minus, PackageX, Plus } from 'lucide-react';

import { formatINR } from '@/lib/format';
import type { Selection } from '@/lib/return-request';

export type PickableItem = {
  orderItemId: string;
  name: string;
  image: string | null;
  size: string;
  color: string;
  /** How many of this line can still be chosen. */
  quantity: number;
  unitPrice: number;
};

/** Tick items and choose how many of each (used by the cancel and return forms). */
export function ItemPicker({
  items,
  selection,
  onChange,
  disabled,
  legend,
  firstRef,
}: {
  items: PickableItem[];
  selection: Selection;
  onChange: (next: Selection) => void;
  disabled?: boolean;
  legend: string;
  firstRef?: React.Ref<HTMLInputElement>;
}) {
  const toggle = (item: PickableItem) =>
    onChange({
      ...selection,
      [item.orderItemId]: {
        checked: !selection[item.orderItemId]?.checked,
        quantity: selection[item.orderItemId]?.quantity || item.quantity,
      },
    });

  const setQuantity = (item: PickableItem, next: number) =>
    onChange({
      ...selection,
      [item.orderItemId]: { checked: true, quantity: Math.min(Math.max(next, 1), item.quantity) },
    });

  const allChecked = items.length > 0 && items.every((item) => selection[item.orderItemId]?.checked);
  const toggleAll = () => {
    const next: Selection = {};
    for (const item of items) {
      next[item.orderItemId] = { checked: !allChecked, quantity: selection[item.orderItemId]?.quantity || item.quantity };
    }
    onChange(next);
  };

  return (
    <fieldset>
      <div className="mb-2 flex items-center justify-between gap-3">
        <legend className="text-sm font-semibold">{legend}</legend>
        {items.length > 1 && (
          <button
            type="button"
            onClick={toggleAll}
            disabled={disabled}
            className="text-xs font-semibold text-[#E53935] underline disabled:opacity-50"
          >
            {allChecked ? 'Clear all' : 'Select all'}
          </button>
        )}
      </div>
      <ul className="space-y-2">
        {items.map((item, index) => {
          const row = selection[item.orderItemId];
          const checked = Boolean(row?.checked);
          const id = `pick-${item.orderItemId}`;
          return (
            <li
              key={item.orderItemId}
              className={`rounded-xl border p-3 transition-colors ${
                checked ? 'border-[#E53935]/60 bg-[#E53935]/5' : 'border-[#111111]/15'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  id={id}
                  ref={index === 0 ? firstRef : undefined}
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(item)}
                  disabled={disabled}
                  className="mt-1 h-5 w-5 shrink-0 accent-[#E53935]"
                />
                <label htmlFor={id} className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#111111]/5">
                      <PackageX className="h-5 w-5 text-[#111111]/35" aria-hidden />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block break-words text-sm font-medium">{item.name}</span>
                    <span className="block text-xs text-[#111111]/55">
                      {[item.size, item.color].filter(Boolean).join(' · ')} · {formatINR(item.unitPrice)} each
                    </span>
                    <span className="block text-xs text-[#111111]/55">Available: {item.quantity}</span>
                  </span>
                </label>
              </div>

              {checked && item.quantity > 1 && (
                <div className="mt-3 flex items-center justify-between pl-8">
                  <span className="text-xs font-semibold text-[#111111]/70">How many?</span>
                  <div className="inline-flex items-center rounded-full border border-[#111111]/20">
                    <button
                      type="button"
                      aria-label={`Fewer ${item.name}`}
                      onClick={() => setQuantity(item, (row?.quantity || 1) - 1)}
                      disabled={disabled || (row?.quantity || 1) <= 1}
                      className="flex h-10 w-10 items-center justify-center disabled:opacity-40"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[2ch] text-center text-sm font-semibold" aria-live="polite">
                      {row?.quantity || 1}
                    </span>
                    <button
                      type="button"
                      aria-label={`More ${item.name}`}
                      onClick={() => setQuantity(item, (row?.quantity || 1) + 1)}
                      disabled={disabled || (row?.quantity || 1) >= item.quantity}
                      className="flex h-10 w-10 items-center justify-center disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

export type Breakdown = {
  lines: { orderItemId: string; name: string; quantity: number; goods: number; discount: number; tax: number; refund: number }[];
  shipping: number;
  final: number;
  includesShipping?: boolean;
};

/** "What you get back", worked out by the server. Shown before anything is sent. */
export function RefundBreakdown({ breakdown, title, note }: { breakdown: Breakdown; title: string; note: string }) {
  const goods = breakdown.lines.reduce((s, l) => s + l.goods, 0);
  const discount = breakdown.lines.reduce((s, l) => s + l.discount, 0);
  const tax = breakdown.lines.reduce((s, l) => s + l.tax, 0);
  const row = 'flex justify-between gap-4 text-sm';
  return (
    <div className="rounded-xl border border-[#111111]/15 bg-[#F7F7F7] p-4" aria-live="polite">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#E53935]">{title}</p>
      <div className="mt-3 space-y-1.5">
        <p className={row}>
          <span className="text-[#111111]/70">Items</span>
          <span>{formatINR(goods)}</span>
        </p>
        {discount > 0 && (
          <p className={row}>
            <span className="text-[#111111]/70">Coupon discount (your share)</span>
            <span>−{formatINR(discount)}</span>
          </p>
        )}
        <p className={row}>
          <span className="text-[#111111]/70">GST (your share)</span>
          <span>{formatINR(tax)}</span>
        </p>
        {breakdown.includesShipping && breakdown.shipping > 0 && (
          <p className={row}>
            <span className="text-[#111111]/70">Shipping</span>
            <span>{formatINR(breakdown.shipping)}</span>
          </p>
        )}
        <p className={`${row} border-t border-[#111111]/15 pt-2 text-base font-bold`}>
          <span>Total refund</span>
          <span className="text-[#E53935]">{formatINR(breakdown.final)}</span>
        </p>
      </div>
      <p className="mt-2 text-xs text-[#111111]/55">{note}</p>
    </div>
  );
}
