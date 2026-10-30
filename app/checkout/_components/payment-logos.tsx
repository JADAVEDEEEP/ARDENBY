'use client';

import Image from 'next/image';

// Official brand marks live in /public/payment-icons (see the README there).
// `ratio` is the logo's width / height so each one renders undistorted.
export const LOGOS = {
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

export type LogoName = keyof typeof LOGOS;

const CHIP = 'inline-flex h-9 shrink-0 items-center justify-center rounded-[4px] border border-[#E5E5E5] bg-white px-2';

/** Full-colour brand logo, 20-24px tall, on a white chip with a 1px #E5E5E5 border. */
export function LogoChip({ name, tall = false }: { name: LogoName; tall?: boolean }) {
  const { alt, ratio } = LOGOS[name];
  const h = tall ? 24 : 20;
  const w = Math.min(64, Math.round(h * ratio));
  const height = Math.round(w / ratio);
  return (
    <span className={CHIP}>
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

/** Clean text label used when no official logo file is available (never a broken image). */
export function TextChip({ label }: { label: string }) {
  return <span className={`${CHIP} text-[14px] font-semibold text-[#111111]`}>{label}</span>;
}

/** "We accept" row shown under the Place Order button. */
export function AcceptedRow() {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2" aria-label="We accept">
      <span className="mr-1 text-[14px] text-[#666666]">We accept</span>
      <LogoChip name="upi" />
      <LogoChip name="visa" />
      <LogoChip name="mastercard" />
      <LogoChip name="rupay" />
    </div>
  );
}
