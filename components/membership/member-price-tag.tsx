'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { MemberBadge, MEMBER_RED } from '@/components/membership/member-badge';
import { useMemberPricing } from '@/hooks/use-member-pricing';
import { formatINR } from '@/lib/format';

/** Card-sized money: whole rupees only (no paise), so the small card never overflows. */
const rupees = (n: number) => formatINR(Math.round(n));
import { cn } from '@/lib/utils';

/**
 * What membership means for ONE product, for whoever is looking:
 *   active member  -> their member price and saving
 *   everyone else  -> the KOVENIK MEMBER price as an invitation to join (never applied to them)
 * Returns null when the product has no membership price (not eligible / no reduction).
 * `price` is the product's current selling price (sale price already applied).
 */
export function useProductMemberPrice(productId: string, price: number) {
  const { member, prices, preview } = useMemberPricing();
  const own = prices[productId];

  if (member) {
    if (own === undefined || own >= price) return null;
    return { isMember: true as const, memberPrice: own, saving: price - own };
  }
  const offered = preview?.prices[productId];
  if (offered === undefined || offered >= price) return null;
  return { isMember: false as const, memberPrice: offered, saving: price - offered };
}

/**
 * Product-card member block, neutral (no red): shield, "Member price" label + price on one line,
 * then the saving (members) or a join link (everyone else). Lines never wrap; long text truncates.
 */
export function MemberPriceTag({
  productId,
  price,
  className,
}: {
  productId: string;
  price: number;
  className?: string;
}) {
  const info = useProductMemberPrice(productId, price);
  if (!info) return null;

  return (
    <div className={cn('mt-2 flex min-w-0 items-center gap-2 rounded-[3px] bg-[#F3F3F1] px-2.5 py-2', className)}>
      <MemberBadge size={18} label={false} tone="ink" className="shrink-0" />
      <div className="min-w-0 flex-1 text-[#111111]">
        <p className="flex flex-col leading-tight md:flex-row md:items-baseline md:gap-1.5 md:whitespace-nowrap">
          <span className="text-[11px] font-medium text-[#666666] md:text-[12px]">Member price</span>
          <strong className="text-[14px] font-bold tabular-nums">{rupees(info.memberPrice)}</strong>
        </p>
        {info.isMember ? (
          <p className="mt-0.5 truncate text-[11px] font-medium leading-tight text-[#444444] md:text-[12px]">
            You save {rupees(info.saving)}
          </p>
        ) : (
          <Link
            href="/membership"
            className="mt-0.5 block truncate text-[11px] font-medium leading-tight text-[#444444] underline underline-offset-2 hover:text-[#111111] md:text-[12px]"
          >
            Save {rupees(info.saving)} · Join
          </Link>
        )}
      </div>
    </div>
  );
}

/** Product page block: member price and saving, or a "join and save" prompt. */
export function MemberPriceNote({
  productId,
  price,
  className,
}: {
  productId: string;
  price: number;
  className?: string;
}) {
  const info = useProductMemberPrice(productId, price);
  if (!info) return null;

  return (
    <Link
      href="/membership"
      aria-label={`KOVENIK member price ${rupees(info.memberPrice)}. ${
        info.isMember ? 'View your membership' : 'View membership'
      }`}
      className={cn(
        'group flex w-full items-center gap-3 rounded-[3px] border border-[#EADFC8] bg-[#FAF4E6] px-3.5 py-3 text-[#111111] transition-colors hover:bg-[#F6ECD6]',
        className
      )}
    >
      <MemberBadge size={26} />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] leading-tight">
          KOVENIK member price{' '}
          <strong className="text-[17px] font-bold tabular-nums">{rupees(info.memberPrice)}</strong>
        </p>
        <p className="mt-1 text-[13px] font-semibold leading-tight" style={{ color: MEMBER_RED }}>
          {info.isMember ? `Member savings ${rupees(info.saving)}` : `Join KOVENIK Membership and save ${rupees(info.saving)}`}
        </p>
      </div>
      <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/**
 * Product-page coupon line. `couponPrice` is the merchandising "price with a coupon" stored on the
 * product; it is worked out against the regular selling price, so it must never be shown next to a
 * member's own price as if it were their price. Members are told coupons apply on top instead
 * (the cart shows the exact total).
 */
export function CouponOfferLine({ couponPrice, className }: { couponPrice: number; className?: string }) {
  const { member } = useMemberPricing();
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-1.5 border-y border-dashed border-[var(--line)] py-3.5 text-[14px] text-[var(--charcoal)]',
        className
      )}
    >
      <span className="border border-[var(--gold)] px-2 py-1 text-[11px] font-semibold uppercase leading-none tracking-[0.14em] text-[var(--gold)]">
        Coupon
      </span>
      {member ? (
        <span>Have a coupon? It applies on top of your member price at checkout.</span>
      ) : (
        <>
          <span>
            Price with a coupon: <span className="font-semibold text-[var(--ink)]">{formatINR(couponPrice)}</span>
          </span>
          <span className="text-[13px] text-[var(--muted)] sm:ml-auto">Apply code at checkout</span>
        </>
      )}
    </div>
  );
}

/** Cart / checkout row under a line: member price and the saving on that line. */
export function MemberLineSaving({ saving, className }: { saving: number; className?: string }) {
  if (saving <= 0) return null;
  return (
    <p className={cn('flex items-center gap-1.5 text-xs font-semibold', className)} style={{ color: MEMBER_RED }}>
      <MemberBadge size={14} label={false} />
      Member savings {formatINR(saving)}
    </p>
  );
}
