'use client';

import { Landmark } from 'lucide-react';
import type { PaymentId } from './shared';
import { LogoChip, TextChip } from './payment-logos';

// These tiles describe what Razorpay's secure window can offer. The window
// itself only lists the methods enabled on the merchant account.
const ONLINE_TILES: {
  label: string;
  logos: React.ReactNode;
  badge?: string;
  note?: string;
}[] = [
  {
    label: 'UPI',
    badge: 'Popular',
    logos: (
      <>
        <LogoChip name="upi" />
        <LogoChip name="gpay" />
        <LogoChip name="phonepe" />
        <LogoChip name="paytm" />
        <TextChip label="BHIM" />
      </>
    ),
  },
  {
    label: 'Cards',
    logos: (
      <>
        <LogoChip name="visa" />
        <LogoChip name="mastercard" />
        <LogoChip name="rupay" />
        <LogoChip name="amex" />
      </>
    ),
  },
  {
    label: 'Net Banking',
    note: '+ all major banks',
    logos: (
      <>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] border border-[#E5E5E5] bg-white">
          <Landmark className="h-5 w-5 text-[#111111]" aria-hidden />
        </span>
        <LogoChip name="sbi" />
        <LogoChip name="hdfc" />
        <LogoChip name="icici" />
        <LogoChip name="axis" />
        <TextChip label="Kotak" />
      </>
    ),
  },
  {
    label: 'Wallets',
    logos: (
      <>
        <LogoChip name="paytm" />
        <LogoChip name="mobikwik" />
        <LogoChip name="amazonpay" />
        <TextChip label="Freecharge" />
      </>
    ),
  },
];

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
          className="flex w-full items-start gap-3 p-4 text-left sm:items-center sm:p-5"
        >
          <Radio on={online} />
          <span className="min-w-0 flex-1">
            <span className="block text-[20px] font-bold text-[#111111]">Pay online</span>
            <span className="block text-[15px] text-[#666666] sm:text-[16px]">
              Instant confirmation in Razorpay&apos;s secure window
            </span>
          </span>
          <span className="hidden shrink-0 items-center rounded-[4px] border border-[#E5E5E5] bg-white px-3 py-2 text-[14px] font-semibold text-[#111111] sm:inline-flex">
            Razorpay Secured
          </span>
        </button>

        {online && (
          <div className="px-4 pb-4 sm:px-5 sm:pb-5">
            <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {ONLINE_TILES.map(({ label, logos, badge, note }) => (
                <li key={label} className="rounded-[4px] bg-[#F5F5F5] p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[17px] font-bold text-[#111111]">{label}</p>
                    {badge && (
                      <span className="rounded-[2px] bg-[#111111] px-2 py-0.5 text-[13px] font-semibold text-white">
                        {badge}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">{logos}</div>
                  {note && <p className="mt-2 text-[14px] text-[#666666]">{note}</p>}
                </li>
              ))}
            </ul>

            <p className="mt-3 text-[15px] leading-6 text-[#666666]">
              Only methods enabled on our Razorpay account appear in the payment window.
            </p>
          </div>
        )}
      </div>

      {/* Cash on delivery */}
      <div className="ck-tile" data-on={cod} data-disabled={disabled || undefined}>
        <button
          type="button"
          role="radio"
          aria-checked={cod}
          disabled={disabled}
          onClick={() => onChange('cod')}
          className="flex w-full items-start gap-3 p-4 text-left sm:items-center sm:p-5"
        >
          <Radio on={cod} />
          <span className="min-w-0 flex-1">
            <span className="block text-[20px] font-bold text-[#111111]">Cash on Delivery</span>
            <span className="block text-[15px] text-[#666666] sm:text-[16px]">
              Pay in cash or UPI to the courier when your order arrives
            </span>
          </span>
          <span className="hidden shrink-0 rounded-full bg-[#F5F5F5] px-3 py-1.5 text-[14px] font-semibold text-[#111111] sm:inline">
            No extra fee
          </span>
        </button>
        <p className="px-4 pb-4 pl-[52px] text-[14px] font-semibold text-[#111111] sm:hidden">No extra fee</p>
      </div>
    </div>
  );
}
