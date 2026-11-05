'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Crown, Tag, Truck, X } from 'lucide-react';

import { MEMBER_RED } from '@/components/membership/member-badge';
import { useMemberPricing, useMemberCartItems } from '@/hooks/use-member-pricing';
import { formatINR } from '@/lib/format';
import { fetchMyMembership, formatDate, type MyMembership } from '@/lib/membership-api';
import { useCartStore } from '@/store/cart-store';
import { cn } from '@/lib/utils';

/**
 * Header membership mark (active members only): a small red crown + MEMBER centred under the logo. Clicking opens a details card
 * with plan, validity, savings and perks. Absolutely positioned off the logo's right edge by the
 * caller's `className`, so it never shifts the logo, search or icons. Hydration-safe.
 */
export function HeaderMember({ className }: { className?: string }) {
  const { member } = useMemberPricing();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [mine, setMine] = useState<MyMembership | null>(null);
  const loaded = useRef(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  // Validity and benefits come from the account's own membership record, loaded on first open.
  useEffect(() => {
    if (!open || loaded.current) return;
    loaded.current = true;
    fetchMyMembership()
      .then(setMine)
      .catch(() => {
        loaded.current = false;
      });
  }, [open]);

  if (!mounted || !member) return null;

  const current = mine?.current ?? null;

  const perks = [
    {
      Icon: Tag,
      top: member.discountPercent > 0 ? `${member.discountPercent}%` : 'Member',
      bottom: 'Member Price',
    },
    { Icon: Truck, top: member.freeDelivery ? 'Free' : 'Standard', bottom: 'Delivery' },
  ];

  return (
    <div ref={root} className={cn('absolute inset-x-0 top-full z-[1] -mt-[8px] sm:-mt-[11px]', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`${member.planName} member. Membership details`}
        className="group flex w-full items-center justify-center gap-1.5 whitespace-nowrap py-0.5 text-kv-ink"
      >
        <span aria-hidden className="h-px min-w-1 flex-1 rounded-full" style={{ background: MEMBER_RED }} />
        <Crown
          className="h-[9px] w-[9px] shrink-0 sm:h-[11px] sm:w-[11px]"
          style={{ color: MEMBER_RED }}
          fill="currentColor"
          strokeWidth={1.6}
          aria-hidden
        />
        <span
          className={cn(
            'text-[8px] font-bold uppercase leading-none tracking-[0.3em] transition-opacity sm:text-[10px]',
            open ? 'opacity-100' : 'opacity-90 group-hover:opacity-100'
          )}
          style={{ paddingLeft: '0.3em' }}
        >
          Member
        </span>
        <span aria-hidden className="h-px min-w-1 flex-1 rounded-full" style={{ background: MEMBER_RED }} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Your KOVENIK membership"
          className="fixed left-3 right-3 top-[68px] z-[110] rounded-2xl border border-kv-line bg-white text-kv-ink shadow-[0_22px_48px_-14px_rgba(17,17,17,0.32)] sm:absolute sm:left-1/2 sm:right-auto sm:top-full sm:mt-2 sm:w-[360px] sm:-translate-x-1/2"
        >
          {/* pointer toward the pill (desktop) */}
          <span
            aria-hidden
            className="absolute -top-[7px] left-1/2 -ml-[7px] hidden h-3.5 w-3.5 rotate-45 border-l border-t border-kv-line bg-white sm:block"
          />

          <div className="relative flex items-center gap-3.5 p-4 pb-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FDEEEE]">
              <Crown className="h-6 w-6" style={{ color: MEMBER_RED }} fill="currentColor" strokeWidth={1.6} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[17px] font-bold uppercase leading-6 tracking-[0.01em]">{member.planName}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-kv-sub">
                <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#1F9D55]" aria-hidden />
                <span className="truncate">
                  Active{current?.endDate ? ` · Valid till ${formatDate(current.endDate)}` : ''}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="flex h-8 w-8 shrink-0 items-center justify-center self-start rounded-full text-kv-sub hover:bg-[#F5F5F5] hover:text-kv-ink sm:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-4">
            <BagSavings />
          </div>

          <ul
            className="mt-4 grid divide-x divide-kv-line border-b border-kv-line px-2 pb-4"
            style={{ gridTemplateColumns: `repeat(${perks.length}, minmax(0, 1fr))` }}
          >
            {perks.map(({ Icon, top, bottom }) => (
              <li key={bottom} className="flex flex-col items-center gap-1 px-2 text-center">
                <Icon className="h-[22px] w-[22px]" strokeWidth={1.5} aria-hidden />
                <span className="mt-1 text-[15px] font-bold leading-4">{top}</span>
                <span className="text-[13px] leading-4 text-kv-sub">{bottom}</span>
              </li>
            ))}
          </ul>

          {mine?.queued && (
            <p className="mx-4 mt-3 rounded-xl bg-[#F5F5F5] px-3 py-2 text-[13px]">
              Renewal queued · {mine.queued.planName} starts {formatDate(mine.queued.startDate)}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 p-4">
            <Link
              href="/profile"
              onClick={close}
              className="flex h-11 items-center justify-center rounded-xl border border-kv-ink bg-white text-[14px] font-bold hover:bg-[#F5F5F5]"
            >
              My Membership
            </Link>
            <Link
              href="/membership"
              onClick={close}
              className="flex h-11 items-center justify-center rounded-xl bg-kv-ink text-[14px] font-bold text-white hover:opacity-90"
            >
              View Plans
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/** What the member price saves on the bag right now (display only; the server prices the order). */
function BagSavings() {
  const storeItems = useCartStore((s) => s.items);
  const { memberSavings } = useMemberCartItems(storeItems);
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-[#FDEEEE] px-4 py-3.5">
      <span className="flex items-center gap-2.5 text-[15px] font-semibold">
        <Tag className="h-[18px] w-[18px]" style={{ color: MEMBER_RED }} strokeWidth={1.7} aria-hidden />
        Savings on your bag
      </span>
      <strong className="text-[20px] font-bold tabular-nums" style={{ color: MEMBER_RED }}>
        {formatINR(memberSavings || 0)}
      </strong>
    </div>
  );
}
