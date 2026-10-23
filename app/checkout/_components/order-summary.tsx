'use client';

import { useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  Headset,
  Loader2,
  Lock,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Truck,
  X,
} from 'lucide-react';
import { formatINR } from '@/lib/format';
import type { CartItem } from '@/types';

export type SummaryPricing = {
  subtotal: number;
  discount: number;
  shipping: number;
  gst: number;
  total: number;
  itemCount: number;
  totalSavings?: number;
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

function Thumb({ item, size = 'md' }: { item: CartItem; size?: 'sm' | 'md' }) {
  return (
    <span
      className={`relative block shrink-0 overflow-hidden  border border-[#3A3A3A] bg-[#10131c] ${
        size === 'sm' ? 'h-10 w-10' : 'h-[60px] w-[52px]'
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
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
      <div className="flex items-center justify-between gap-2  border border-[#3A3A3A] bg-[#0A0A0A] px-3 py-2.5 text-sm">
        <span className="flex items-center gap-2 font-semibold text-[#C0C0C0]">
          <Tag className="h-4 w-4" /> {promo.couponCode} applied
        </span>
        <button
          type="button"
          onClick={promo.remove}
          aria-label="Remove coupon"
          className=" p-1 text-[#C0C0C0] hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Promo or gift code</span>
          <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C0C0C0]/70" />
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
            className="ck-input !h-11 !py-0 !pl-9"
          />
        </label>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={promo.applying}
          className="inline-flex h-11 min-w-[88px] shrink-0 items-center justify-center gap-1.5 border border-[#C0C0C0] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#C0C0C0] hover:text-[#0A0A0A] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {promo.applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
        </button>
      </div>
      {promo.error && (
        <p role="alert" className="mt-1.5 text-xs text-[#ffffff]">
          {promo.error}
        </p>
      )}
    </div>
  );
}

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
  const { subtotal, discount, shipping, gst, itemCount } = pricing;

  return (
    <>
      <ul className="ck-scroll max-h-[340px] pl-2 pt-1 divide-y divide-white/[0.07] overflow-y-auto pr-1">
        {items.map((item) => (
          <li key={itemKey(item)} className="flex items-center gap-3.5 py-3.5">
            <span className="relative block shrink-0">
              <Thumb item={item} />
              <span className="absolute -left-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-black">
                {item.quantity}
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium leading-snug text-[#ffffff]">{item.name}</p>
              <p className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] font-semibold">
                <span className="border border-[#3A3A3A] bg-white/5 px-2 py-0.5 text-[#C0C0C0]">
                  Size {item.size}
                </span>
                {item.color && (
                  <span className="border border-[#3A3A3A] bg-white/5 px-2 py-0.5 text-[#C0C0C0]">
                    {String(item.color)}
                  </span>
                )}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-[#ffffff]">
              {formatINR(item.price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 border-t border-[#2A2A2A] pt-4">
        <PromoField promo={promo} />
      </div>

      <dl className="mt-4 space-y-2.5 text-sm">
        <div className="flex justify-between text-[#C0C0C0]">
          <dt>
            Subtotal · {itemCount} {itemCount === 1 ? 'unit' : 'units'}
          </dt>
          <dd className="font-medium text-[#ffffff]">{formatINR(subtotal)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-[#C0C0C0]">
            <dt>Coupon{couponCode ? ` (${couponCode})` : ''}</dt>
            <dd className="font-medium text-[#C0C0C0]">−{formatINR(discount)}</dd>
          </div>
        )}
        <div className="flex justify-between text-[#C0C0C0]">
          <dt>Shipping · Standard</dt>
          <dd className={shipping === 0 ? 'inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[#C0C0C0]' : 'font-medium text-[#ffffff]'}>
            {shipping === 0 ? (
              <>
                <Truck className="h-3.5 w-3.5" /> FREE
              </>
            ) : (
              formatINR(shipping)
            )}
          </dd>
        </div>
        <div className="flex justify-between text-[#C0C0C0]">
          <dt>GST (5%)</dt>
          <dd className="font-medium text-[#ffffff]">{formatINR(gst)}</dd>
        </div>
        {(pricing.totalSavings ?? 0) > 0 && (
          <div className="flex justify-between border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2.5 text-white">
            <dt>You save</dt>
            <dd className="font-semibold tabular-nums">{formatINR(pricing.totalSavings ?? 0)}</dd>
          </div>
        )}
      </dl>
    </>
  );
}

export function PlaceOrderButton({
  label,
  busy,
  disabled,
  total,
  className = '',
}: {
  label: string;
  busy: boolean;
  disabled?: boolean;
  total: number;
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
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
      <span>{label}</span>
      {!busy && (
        <>
          <span aria-hidden className="opacity-70">·</span>
          <span>{formatINR(total)}</span>
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
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
    <section
      aria-label="Order summary"
      className="ck-panel overflow-hidden"
    >
      <header className="flex items-center justify-between px-5 pt-5 sm:px-6 sm:pt-6">
        <h2 className="flex items-center gap-2 text-lg text-white">
          <Lock className="h-4 w-4 text-[#C0C0C0]" strokeWidth={1.5} /> Order Summary
        </h2>
        <span className="ck-chip-chrome px-2.5 py-0.5 text-[10px] font-semibold">
          {pricing.itemCount} {pricing.itemCount === 1 ? 'ITEM' : 'ITEMS'}
        </span>
      </header>

      <div className="p-5 pt-4 sm:px-6 sm:pb-6">
        <SummaryBody items={items} pricing={pricing} couponCode={couponCode} promo={promo} />

        <div className="mt-4 flex items-end justify-between border-t border-[#2A2A2A] pt-4">
          <div>
            <p className="text-base font-bold text-white">Order Total</p>
            <p className="text-[11px] text-[#C0C0C0]/70">Inclusive of all taxes</p>
          </div>
          <strong className="ck-chrome-text text-3xl font-semibold tabular-nums">
            {formatINR(pricing.total)}
          </strong>
        </div>

        <div className="mt-5">{cta}</div>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-[#C0C0C0]/70">
          <ShieldCheck className="h-3.5 w-3.5 text-[#C0C0C0]" />
          {paymentNote}
        </p>
      </div>

      <TrustRow />
    </section>
  );
}

const TRUST = [
  { Icon: Truck, title: 'Free Shipping', sub: 'Above ₹999', tone: 'ck-ico-cyan' },
  { Icon: ShieldCheck, title: 'Secure Pay', sub: 'Encrypted', tone: 'ck-ico-blue' },
  { Icon: RotateCcw, title: 'Easy Returns', sub: 'Hassle-free', tone: 'ck-ico-violet' },
  { Icon: Headset, title: 'Support', sub: 'Here to help', tone: 'ck-ico-pink' },
];

export function TrustRow({ compact = false }: { compact?: boolean }) {
  return (
    <ul
      className={`grid grid-cols-4 gap-2 ${compact ? 'px-1 py-2' : 'border-t border-[#2A2A2A] px-4 py-5'}`}
    >
      {TRUST.map(({ Icon, title, sub, tone }) => (
        <li key={title} className="flex flex-col items-center text-center">
          <Icon className="h-5 w-5 text-[#C0C0C0]" strokeWidth={1.25} />
          <span className="mt-2 text-[10px] uppercase leading-snug tracking-[0.14em] text-[#C0C0C0]">{title}</span>
        </li>
      ))}
    </ul>
  );
}

/** Mobile: thumbnails + total, expands to the full summary. */
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
        className="flex w-full items-center gap-3 p-3.5 text-left"
      >
        <span className="flex shrink-0 -space-x-3">
          {items.slice(0, 3).map((i) => (
            <span key={itemKey(i)} className=" ring-2 ring-[#0a0a0a]">
              <Thumb item={i} size="sm" />
            </span>
          ))}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-[#ffffff]">
            {pricing.itemCount} {pricing.itemCount === 1 ? 'item' : 'items'}
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-[#C0C0C0]">
            {open ? 'Hide summary' : 'Show summary'}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
          </span>
        </span>
        <strong className="text-xl font-semibold tabular-nums text-white">{formatINR(pricing.total)}</strong>
      </button>

      <div id="ck-mobile-summary" className="ck-collapse" data-open={open}>
        <div>
          <div className="border-t border-[#2A2A2A] px-4 pb-4 pt-2">
            <SummaryBody items={items} pricing={pricing} couponCode={couponCode} promo={promo} />
          </div>
        </div>
      </div>
    </section>
  );
}
