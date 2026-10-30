'use client';

import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

/** 16px square checkbox row with a count on the right. */
export function CheckRow({
  label,
  count,
  checked,
  onToggle,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className="group flex min-h-[34px] w-full items-center gap-3 text-left"
    >
      <span
        aria-hidden
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-[1.2px] transition-colors',
          checked ? 'border-[var(--ink)] bg-[var(--ink)]' : 'border-[#B1B1B1] group-hover:border-[var(--ink)]'
        )}
      >
        {checked && <Check className="h-3 w-3 stroke-[3] text-[var(--ivory)]" />}
      </span>
      <span className={cn('flex-1 text-[15px] text-[var(--charcoal)]', checked && 'font-semibold text-[var(--ink)]')}>
        {label}
      </span>
      {typeof count === 'number' && <span className="text-[13px] tabular-nums text-[var(--soft)]">{count}</span>}
    </button>
  );
}

/** Label + switch row ("In stock only", "On sale"). */
export function ToggleRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className="flex min-h-[40px] w-full items-center justify-between text-left text-[15px] text-[var(--charcoal)]"
    >
      <span>{label}</span>
      <span
        aria-hidden
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors',
          checked ? 'bg-[var(--ink)]' : 'bg-[var(--line)]'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-[var(--ivory)] transition-all',
            checked ? 'left-[18px]' : 'left-0.5'
          )}
        />
      </span>
    </button>
  );
}
