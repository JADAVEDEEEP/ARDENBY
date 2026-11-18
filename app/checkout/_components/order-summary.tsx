'use client';

import { useState } from 'react';
import { ChevronDown, Headset, Loader2, Lock, RotateCcw, ShieldCheck, ShoppingBag, Tag, Truck, X } from 'lucide-react';
import { formatINR } from '@/lib/format';
import type { CartItem } from '@/types';
import { MemberBadge } from '@/components/membership/member-badge';
import { AcceptedRow } from './payment-logos';

export type SummaryPricing = {
  subtotal: number;
  discount: number;
  shipping: number;
  gst: number;
  /** COD handling fee including its GST; 0 for prepaid orders. */
  codFee?: number;
  total: number;
  itemCount: number;
  totalSavings?: number;
  /** Savings already included in the prices (active members only). */
  memberSavings?: number;
  memberTier?: string | null;
};

export type PromoControls = {
  couponCode: string | null;
  applying: boolean;
  error: string;
  apply: (code: string) => Promise<boolean>;
  remove: () => void;
  clearError: () => void;
};

const itemKey = (i: CartItem) => `${i.productId}-${i.size}-${i.color}`;
const itemsLabel = (n: number) => `${n} ${n === 1 ? 'item' : 'items'}`;

function Thumb({ item }: { item: CartItem }) {
  return (
    <span className="relative block h-[88px] w-[72px] shrink-0 overflow-hidden rounded-[10px] border border-[#EDEDED] bg-[#F5F5F5]">
      {item.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
      ) : (
        <ShoppingBag className="m-auto h-5 w-5 text-[#666666]" aria-hidden />
      )}
    </span>
  );
}

function PromoField({ promo }: { promo: PromoControls }) {
  const [code, setCode] = useState('');

  const submit = async () => {
    if (await promo.apply(code)) setCode('');
  };

  if (promo.couponCode) {
    return (
      <div className="flex min-h-[48px] items-center justify-between gap-2 rounded-[10px] border border-[#E5E5E5] bg-[#F5F5F5] px-3 text-[15px]">
        <span className="flex items-center gap-2 font-semibold text-[#111111]">
          <Tag className="h-4 w-4" /> {promo.couponCode} <span className="font-normal text-[#666666]">applied</span>
        </span>
        <button
          type="button"
          onClick={promo.remove}
          aria-label="Remove coupon"
          className="flex h-11 w-11 items-center justify-center text-[#111111] rounded-full hover:bg-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Promo or gift code</span>
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (promo.error) promo.clearError();
            }}
            onKeyDown={(e) => {
              // Inside the checkout <form>: Enter must apply the code, not place the order.
              if (e.key === 'Enter') {
                e.preventDefault();
                void submit();
              }
            }}
            placeholder="Promo or gift code"
            autoComplete="off"
            aria-invalid={Boolean(promo.error)}
            aria-describedby={promo.error ? 'promo-error' : undefined}
            className="ck-input"
          />
        </label>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={promo.applying}
          className="ck-ghost min-w-[96px] shrink-0"
        >
          {promo.applying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
        </button>
      </div>
      {promo.error && (
        <p id="promo-error" role="alert" className="mt-2 text-[15px] font-medium text-[#C8211F]">
          {promo.error}
        </p>
      )}
    </div>
  );
}

/** Subtotal / shipping / GST / savings lines, shared by the summary and the mobile "Price details". */
export function PriceLines({ pricing, couponCode }: { pricing: SummaryPricing; couponCode: string | null }) {
  const { subtotal, discount, shipping, gst, itemCount } = pricing;
  const memberSavings = pricing.memberSavings ?? 0;

  return (
    <dl className="space-y-3 text-[15px] leading-6 sm:text-[16px]">
      <div className="flex justify-between gap-3 text-[#444444]">
        <dt>Subtotal ({itemsLabel(itemCount)})</dt>
        <dd className="font-medium tabular-nums text-[#111111]">{formatINR(subtotal)}</dd>
      </div>
      {discount > 0 && (
        <div className="flex justify-between gap-3 text-[#444444]">
          <dt>Coupon{couponCode ? ` (${couponCode})` : ''}</dt>
          <dd className="font-medium tabular-nums text-[#C8211F]">−{formatINR(discount)}</dd>
        </div>
      )}
      <div className="flex justify-between gap-3 text-[#444444]">
        <dt>Shipping · Standard</dt>
        <dd className="font-bold tabular-nums text-[#111111]">{shipping === 0 ? 'FREE' : formatINR(shipping)}</dd>
      </div>
      <div className="flex justify-between gap-3 text-[#444444]">
        <dt>GST (5%)</dt>
        <dd className="font-medium tabular-nums text-[#111111]">{formatINR(gst)}</dd>
      </div>
      {(pricing.codFee ?? 0) > 0 && (
        <div className="flex justify-between gap-3 text-[#444444]">
          <dt>COD handling fee (incl. GST)</dt>
          <dd className="font-medium tabular-nums text-[#111111]">{formatINR(pricing.codFee ?? 0)}</dd>
        </div>
      )}
      {memberSavings > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-[10px] bg-[#F5F5F5] px-3 py-2.5 font-semibold text-[#111111]">
          <dt className="flex min-w-0 items-center gap-2">
            <MemberBadge size={20} label={false} tone="ink" />
            <span>Member Savings{pricing.memberTier ? ` · ${pricing.memberTier}` : ''}</span>
          </dt>
          <dd className="shrink-0 tabular-nums">−{formatINR(memberSavings)}</dd>
        </div>
      )}
    </dl>
  );
}

/** "You save ₹X on this order" – only when the cart carries savings. */
function SavingsPill({ pricing }: { pricing: SummaryPricing }) {
  const savings = pricing.totalSavings ?? 0;
  if (savings <= 0) return null;
  return (
    <p className="ck-pill-save mt-4">
      <Tag className="h-4 w-4" aria-hidden /> You save {formatINR(savings)} on this order
    </p>
  );
}

function TotalRow({ total }: { total: number }) {
  return (
    <div className="flex items-end justify-between gap-3 border-t border-[#E5E5E5] pt-5">
      <div>
        <p className="text-[18px] font-bold text-[#111111]">Total payable</p>
        <p className="text-[15px] text-[#666666]">Inclusive of all taxes</p>
      </div>
      <strong className="text-[30px] font-bold leading-none tabular-nums text-[#111111] sm:text-[34px]">
        {formatINR(total)}
      </strong>
    </div>
  );
}

function ItemRows({ items }: { items: CartItem[] }) {
  return (
    <ul className="ck-scroll max-h-[380px] space-y-4 overflow-y-auto pb-1 pl-2 pr-1 pt-3">
      {items.map((item) => {
        const lineMrp = (item.mrp || 0) * item.quantity;
        const linePrice = item.price * item.quantity;
        return (
          <li key={itemKey(item)} className="flex items-start gap-3.5">
            <span className="relative block shrink-0">
              <Thumb item={item} />
              <span className="absolute -left-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#111111] px-1 text-[12px] font-bold text-white ring-2 ring-white">
                {item.quantity}
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[15px] font-semibold leading-[21px] text-[#111111]">{item.name}</p>
              <p className="mt-1 text-[14px] leading-5 text-[#666666]">
                {[item.size && `Size ${item.size}`, item.color && String(item.color), `Qty ${item.quantity}`]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <span className="shrink-0 text-right">
              <span className="block text-[16px] font-bold tabular-nums text-[#111111]">{formatINR(linePrice)}</span>
              {lineMrp > linePrice && (
                <span className="block text-[14px] tabular-nums text-[#666666] line-through">{formatINR(lineMrp)}</span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Items + promo + price lines (used inside the mobile expandable summary). */
export function SummaryBody({
  items,
  pricing,
  couponCode,
  promo,
}: {
  items: CartItem[];
  pricing: SummaryPricing;
  couponCode: string | null;
  promo: PromoControls;
}) {
  return (
    <>
      <ItemRows items={items} />
      <div className="mt-4">
        <PromoField promo={promo} />
      </div>
      <div className="mt-5">
        <PriceLines pricing={pricing} couponCode={couponCode} />
      </div>
    </>
  );
}

export function PlaceOrderButton({
  label,
  busy,
  disabled,
  total,
  showTotal = true,
  className = '',
}: {
  label: string;
  busy: boolean;
  disabled?: boolean;
  total: number;
  /** Hide the price inside the button where the total is already shown beside it. */
  showTotal?: boolean;
  className?: string;
}) {
  return (
    <button
      type="submit"
      form="checkout-form"
      disabled={busy || disabled}
      aria-busy={busy}
      className={`ck-cta ${className}`}
    >
      {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
      <span className="whitespace-nowrap">{label}</span>
      {!busy && showTotal && (
        <>
          <span aria-hidden>·</span>
          <span>{formatINR(total)}</span>
        </>
      )}
    </button>
  );
}

const TRUST = [
  { Icon: Truck, title: 'Flat ₹49 shipping' },
  { Icon: ShieldCheck, title: 'Secure payments' },
  { Icon: RotateCcw, title: '7-day easy returns' },
  { Icon: Headset, title: 'Customer support' },
];

/** 2×2 trust grid. */
export function TrustRow() {
  return (
    <ul className="grid grid-cols-2 border-t border-[#EDEDED] bg-[#FAFAFA]">
      {TRUST.map(({ Icon, title }, i) => (
        <li
          key={title}
          className={`flex min-h-[60px] items-center gap-3 px-4 py-3 text-[14px] font-semibold leading-5 text-[#111111] ${
            i % 2 === 0 ? 'border-r border-[#EDEDED]' : ''
          } ${i < 2 ? 'border-b border-[#EDEDED]' : ''}`}
        >
          <Icon className="h-5 w-5 shrink-0" strokeWidth={1.6} aria-hidden />
          {title}
        </li>
      ))}
    </ul>
  );
}

export function DesktopSummary({
  items,
  pricing,
  couponCode,
  promo,
  cta,
  paymentNote,
}: {
  items: CartItem[];
  pricing: SummaryPricing;
  couponCode: string | null;
  promo: PromoControls;
  cta: React.ReactNode;
  paymentNote: string;
}) {
  return (
    <section aria-label="Order summary" className="ck-panel overflow-hidden">
      <div className="p-5 sm:p-6">
        <header className="flex items-baseline justify-between gap-3">
          <h2 className="ck-h">Order summary</h2>
          <span className="text-[16px] font-semibold text-[#666666]">{itemsLabel(pricing.itemCount)}</span>
        </header>

        <div className="mt-4">
          <ItemRows items={items} />
        </div>

        <div className="mt-4">
          <PromoField promo={promo} />
        </div>

        <div className="mt-5">
          <PriceLines pricing={pricing} couponCode={couponCode} />
        </div>

        <div className="mt-5">
          <TotalRow total={pricing.total} />
        </div>

        <div className="mt-6">{cta}</div>

        <SavingsPill pricing={pricing} />

        <p className="mt-3 text-center text-[14px] leading-5 text-[#666666]">{paymentNote}</p>
        <AcceptedRow />
      </div>

      <TrustRow />
    </section>
  );
}

/** Mobile: "Show summary · 8 items · ₹10,645 ▾", expands to the item list and promo field. */
export function MobileSummaryBar({
  items,
  pricing,
  couponCode,
  promo,
}: {
  items: CartItem[];
  pricing: SummaryPricing;
  couponCode: string | null;
  promo: PromoControls;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section aria-label="Order summary" className="ck-panel overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="ck-mobile-summary"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left"
      >
        <ShoppingBag className="h-5 w-5 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 text-[16px] font-semibold text-[#111111]">
          {open ? 'Hide summary' : 'Show summary'} <span className="font-normal text-[#666666]">· {itemsLabel(pricing.itemCount)}</span>
        </span>
        <strong className="text-[18px] font-bold tabular-nums text-[#111111]">{formatINR(pricing.total)}</strong>
        <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      <div id="ck-mobile-summary" className="ck-collapse" data-open={open}>
        <div>
          <div className="border-t border-[#E5E5E5] px-4 pb-4 pt-4">
            <ItemRows items={items} />
            <div className="mt-4">
              <PromoField promo={promo} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Mobile-only price breakdown shown before the end of the page. */
export function MobilePriceDetails({ pricing, couponCode }: { pricing: SummaryPricing; couponCode: string | null }) {
  return (
    <section aria-label="Price details" className="ck-panel p-4">
      <h2 className="ck-h mb-4">Price details</h2>
      <PriceLines pricing={pricing} couponCode={couponCode} />
      <div className="mt-4">
        <TotalRow total={pricing.total} />
      </div>
      <SavingsPill pricing={pricing} />
    </section>
  );
}
