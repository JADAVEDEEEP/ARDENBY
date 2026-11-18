'use client';

import { Info, ShieldCheck } from 'lucide-react';
import type { PaymentId } from './shared';
import { LogoChip, TextChip } from './payment-logos';
import { COD_FEE, COD_LIMIT_MESSAGE } from '@/lib/pricing';

function Radio({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
        on ? 'border-[#111111]' : 'border-[#BDBDBD]'
      }`}
    >
      {on && <span className="h-3 w-3 rounded-full bg-[#111111]" />}
    </span>
  );
}

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="shrink-0 rounded-[4px] bg-[#111111] px-2 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-white">
    {children}
  </span>
);

export function PaymentSection({
  value,
  onChange,
  disabled,
  codAvailable = true,
}: {
  value: PaymentId;
  onChange: (v: PaymentId) => void;
  disabled?: boolean;
  /** False when the goods value is over the COD limit. */
  codAvailable?: boolean;
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
          className="flex w-full items-start gap-3 p-4 text-left sm:items-center sm:p-5"
        >
          <Radio on={online} />
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-bold leading-6 text-[#111111] sm:text-[17px]">Pay online</span>
            <span className="mt-0.5 block text-[14px] leading-5 text-[#666666]">UPI, cards, net banking and wallets</span>
          </span>
          <Tag>Instant</Tag>
        </button>

        {online && (
          <div className="border-t border-[#EDEDED] px-4 pb-4 pt-3.5 sm:px-5">
            <div className="flex flex-wrap items-center gap-1.5" aria-label="Accepted payment methods">
              <LogoChip name="upi" />
              <LogoChip name="gpay" />
              <LogoChip name="phonepe" />
              <LogoChip name="paytm" />
              <LogoChip name="visa" />
              <LogoChip name="mastercard" />
              <LogoChip name="rupay" />
              <TextChip label="+ more" />
            </div>
            <p className="mt-3 flex items-start gap-2 text-[13px] leading-5 text-[#666666]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#111111]" aria-hidden />
              You&apos;ll pay in Razorpay&apos;s secure window. It lists the methods enabled on our account.
            </p>
          </div>
        )}
      </div>

      {/* Cash on delivery */}
      <div className="ck-tile" data-on={cod} data-disabled={disabled || !codAvailable || undefined}>
        <button
          type="button"
          role="radio"
          aria-checked={cod}
          aria-disabled={!codAvailable}
          disabled={disabled || !codAvailable}
          onClick={() => onChange('cod')}
          className="flex w-full items-start gap-3 p-4 text-left sm:items-center sm:p-5"
        >
          <Radio on={cod} />
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-bold leading-6 text-[#111111] sm:text-[17px]">Cash on Delivery</span>
            <span className="mt-0.5 block text-[14px] leading-5 text-[#666666]">
              Pay in cash or UPI to the courier when your order arrives
            </span>
          </span>
          <span className="hidden shrink-0 rounded-[4px] border border-[#E5E5E5] bg-white px-2.5 py-1 text-[12px] font-semibold text-[#111111] sm:inline-flex">
            {codAvailable ? `+ ₹${COD_FEE} fee` : 'Unavailable'}
          </span>
        </button>
        {codAvailable ? (
          <p className="px-4 pb-4 pl-[52px] text-[13px] font-semibold text-[#111111] sm:hidden">+ ₹{COD_FEE} handling fee (plus GST)</p>
        ) : (
          <p role="status" className="flex items-start gap-2 px-4 pb-4 pl-[52px] text-[13px] leading-5 text-[#444444] sm:pl-[56px]">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {COD_LIMIT_MESSAGE}
          </p>
        )}
      </div>
    </div>
  );
}
