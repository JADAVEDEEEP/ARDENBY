'use client';

import Image from 'next/image';
import { Banknote, Landmark, Wallet, Zap } from 'lucide-react';
import type { PaymentId } from './shared';

// Official brand marks live in /public/payment-icons (see the README there).
// `ratio` is the logo's width / height so each one renders undistorted.
const LOGOS = {
  razorpay: { alt: 'Razorpay', ratio: 0.87 },
  upi: { alt: 'UPI', ratio: 2.83 },
  gpay: { alt: 'Google Pay', ratio: 2.52 },
  phonepe: { alt: 'PhonePe', ratio: 1 },
  paytm: { alt: 'Paytm', ratio: 3.13 },
  visa: { alt: 'Visa', ratio: 3.1 },
  mastercard: { alt: 'Mastercard', ratio: 1.62 },
  rupay: { alt: 'RuPay', ratio: 3.64 },
  amex: { alt: 'American Express', ratio: 1 },
  sbi: { alt: 'State Bank of India', ratio: 2.9 },
  hdfc: { alt: 'HDFC Bank', ratio: 0.95 },
  icici: { alt: 'ICICI Bank', ratio: 0.92 },
  axis: { alt: 'Axis Bank', ratio: 1.15 },
  mobikwik: { alt: 'MobiKwik', ratio: 4.33 },
  amazonpay: { alt: 'Amazon Pay', ratio: 5.2 },
} as const;

type LogoName = keyof typeof LOGOS;

/** Full-colour logo on a small white chip so it stays legible on dark. */
function LogoChip({ name, size = 'sm' }: { name: LogoName; size?: 'sm' | 'md' }) {
  const { alt, ratio } = LOGOS[name];
  const h = size === 'sm' ? 14 : 20; // inner height; chip adds 4px padding each side
  const maxW = size === 'sm' ? 48 : 56;
  const w = Math.min(maxW, Math.round(h * ratio));
  const height = Math.round(w / ratio);
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded border border-[#d9d9d9] bg-white p-1">
      <Image
        src={`/payment-icons/${name}.svg`}
        alt={alt}
        width={w}
        height={height}
        unoptimized
        className="block object-contain"
        style={{ width: w, height }}
      />
    </span>
  );
}

// These tiles describe what Razorpay's secure window can offer. The window
// itself only lists the methods enabled on the merchant account.
const ONLINE_TILES: {
  label: string;
  short: string;
  main: React.ReactNode;
  brands: LogoName[];
  badge?: string;
}[] = [
  {
    label: 'UPI',
    short: 'Any UPI app',
    main: <LogoChip name="upi" size="md" />,
    brands: ['gpay', 'phonepe', 'paytm'],
    badge: 'Popular',
  },
  {
    label: 'Cards',
    short: 'Visa · RuPay',
    main: (
      <span className="flex gap-1">
        <LogoChip name="visa" size="md" />
        <LogoChip name="mastercard" size="md" />
      </span>
    ),
    brands: ['visa', 'mastercard', 'rupay', 'amex'],
  },
  {
    label: 'Net Banking',
    short: '50+ banks',
    main: (
      <span className="ck-ico flex h-9 w-9 items-center justify-center rounded-full">
        <Landmark className="h-[18px] w-[18px]" aria-hidden />
      </span>
    ),
    brands: ['sbi', 'hdfc', 'icici', 'axis'],
  },
  {
    label: 'Wallets',
    short: 'Paytm & more',
    main: (
      <span className="ck-ico flex h-9 w-9 items-center justify-center rounded-full">
        <Wallet className="h-[18px] w-[18px]" aria-hidden />
      </span>
    ),
    brands: ['paytm', 'mobikwik', 'amazonpay'],
  },
];

function Radio({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
        on ? 'border-[#C0C0C0]' : 'border-[#3A3A3A]'
      }`}
    >
      {on && <span className="ck-radio-dot h-3 w-3 rounded-full" />}
    </span>
  );
}

export function PaymentSection({
  value,
  onChange,
  disabled,
}: {
  value: PaymentId;
  onChange: (v: PaymentId) => void;
  disabled?: boolean;
}) {
  const online = value === 'online';
  const cod = value === 'cod';

  return (
    <div role="radiogroup" aria-label="Payment method" className="space-y-3">
      {/* Razorpay */}
      <div className="ck-tile" data-on={online} data-disabled={disabled || undefined}>
        <button
          type="button"
          role="radio"
          aria-checked={online}
          disabled={disabled}
          onClick={() => onChange('online')}
          className="flex w-full items-center gap-3  p-4 text-left sm:p-5"
        >
          <Radio on={online} />
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-semibold text-[#ffffff]">Pay online</span>
            <span className="block text-xs text-[#C0C0C0] sm:text-sm">
              <span className="sm:hidden">Instant confirmation</span>
              <span className="hidden sm:inline">
                Instant confirmation · completed in Razorpay’s secure window
              </span>
            </span>
          </span>
          <span className="hidden shrink-0 items-center gap-2.5  border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 sm:flex">
            <LogoChip name="razorpay" size="md" />
            <span className="leading-tight">
              <span className="block text-sm font-medium text-[#ffffff]">Razorpay</span>
              <span className="block text-[9px] font-semibold tracking-[0.14em] text-[#C0C0C0]/70">
                SECURED CHECKOUT
              </span>
            </span>
          </span>
        </button>

        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <ul className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {ONLINE_TILES.map(({ label, short, main, brands, badge }) => (
              <li
                key={label}
                className=" border border-[#2A2A2A] bg-[#111111] p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  {main}
                  {badge && (
                    <span className="border border-[#3A3A3A] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-[#C0C0C0]">
                      {badge}
                    </span>
                  )}
                </div>
                <p className="mt-2.5 text-sm font-medium text-[#ffffff]">{label}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-[#C0C0C0]/70 sm:hidden">{short}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {brands.map((b) => (
                    <LogoChip key={b} name={b} />
                  ))}
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-3 flex items-start gap-2 border-t border-[#2A2A2A] pt-3 text-xs text-[#C0C0C0]/70">
            <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C0C0C0]" />
            Only the methods enabled on our Razorpay account appear in the payment window.
          </p>
        </div>
      </div>

      {/* Cash on delivery */}
      <div className="ck-tile" data-on={cod} data-disabled={disabled || undefined}>
        <button
          type="button"
          role="radio"
          aria-checked={cod}
          disabled={disabled}
          onClick={() => onChange('cod')}
          className="flex w-full items-center gap-3  p-4 text-left sm:p-5"
        >
          <Radio on={cod} />
          <span className="inline-flex shrink-0 items-center justify-center rounded border border-[#d9d9d9] bg-white p-1.5 text-[#0b8f66]">
            <Banknote className="h-6 w-6" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold text-[#ffffff]">Cash on Delivery</span>
            <span className="block text-xs text-[#C0C0C0] sm:text-sm">
              Pay in cash or UPI to the courier when your order arrives.
            </span>
          </span>
          <span className="hidden shrink-0 rounded-full border border-[#3A3A3A] px-3 py-1 text-[11px] font-semibold text-[#C0C0C0] sm:inline">
            No extra fee
          </span>
        </button>
      </div>
    </div>
  );
}
