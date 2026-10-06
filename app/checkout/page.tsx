'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Truck,
  CreditCard,
  ShoppingBag,
  Lock,
  User,
  Phone,
  MapPin,
  Building2,
  Hash,
  Zap,
  RotateCcw,
  Headset,
  Crown,
  Landmark,
  Wallet,
  ChevronRight,
  Check,
  Plus,
  Pencil,
  Trash2,
  X,
  Star,
  Loader2,
} from 'lucide-react';
import { useCartStore, getCartSubtotal } from '@/store/cart-store';
import { formatINR } from '@/lib/format';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const GOLD = '#D4AF37';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C96A]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]';

type Address = {
  id: string;
  name: string;
  phone: string;
  pincode: string;
  address: string;
  city: string;
  state: string;
  address_type: string;
  is_default: boolean;
};

type AddressForm = {
  name: string;
  phone: string;
  pincode: string;
  address: string;
  city: string;
  state: string;
  address_type: string;
  is_default: boolean;
};

async function apiRequest(
  path: string,
  options: RequestInit = {}
) {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('ardenby_token')
      : null;

  if (!token) {
    throw new Error('AUTH_REQUIRED');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || 'Something went wrong'
    );
  }

  return data;
}

function unwrap<T = any>(data: any, keys: string[]): T {
  for (const key of keys) {
    if (data?.[key] !== undefined) return data[key] as T;
  }
  return data as T;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050505] text-[#F5F1E8]">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-[420px] w-[420px] rounded-full opacity-[0.07] blur-3xl"
        style={{ background: GOLD }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

function StepIndicator() {
  const steps = ['Information', 'Payment', 'Order Placed'];

  return (
    <ol
      className="flex w-full max-w-[420px] items-start"
      aria-label="Checkout progress"
    >
      {steps.map((label, i) => {
        const active = i === 0;

        return (
          <li
            key={label}
            className="relative flex flex-1 flex-col items-center"
            aria-current={active ? 'step' : undefined}
          >
            {i > 0 && (
              <span
                aria-hidden
                className="absolute right-1/2 top-4 h-px w-full bg-gradient-to-r from-[#D4AF37]/60 to-white/10"
              />
            )}

            <span
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                active
                  ? 'border-[#D4AF37] bg-[#050505] text-[#E8C96A] shadow-[0_0_14px_rgba(212,175,55,0.35)]'
                  : 'border-white/20 bg-[#050505] text-neutral-400'
              }`}
            >
              {i + 1}
            </span>

            <span
              className={`mt-2 text-[11px] sm:text-xs ${
                active ? 'text-[#E8C96A]' : 'text-neutral-400'
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function CardTitle({
  index,
  title,
  note,
  icon,
}: {
  index: number;
  title: string;
  note?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-center justify-between gap-3">
      <div className="flex items-center gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#D4AF37]/70 font-serif text-lg text-[#E8C96A]">
          {index}
        </span>
        <h2 className="font-serif text-2xl text-[#F5F1E8]">{title}</h2>
      </div>

      {note && (
        <span className="hidden items-center gap-2 text-xs text-neutral-400 sm:inline-flex">
          {icon}
          {note}
        </span>
      )}
    </div>
  );
}

const cardClass =
  'rounded-lg border border-white/10 bg-[#0A0C0C] p-5 sm:p-7 shadow-[0_0_0_1px_rgba(212,175,55,0.04)]';

type PaymentId = 'upi' | 'card' | 'netbanking' | 'wallets' | 'cod';

const METHODS: {
  id: PaymentId;
  label: string;
  short: string;
  sub: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'upi',
    label: 'UPI',
    short: 'UPI',
    sub: 'Pay instantly using any UPI app',
    Icon: Zap,
  },
  {
    id: 'card',
    label: 'Card Payment',
    short: 'Card',
    sub: 'Pay with Credit or Debit Card',
    Icon: CreditCard,
  },
  {
    id: 'netbanking',
    label: 'Net Banking',
    short: 'Net Banking',
    sub: 'All major banks supported',
    Icon: Landmark,
  },
  {
    id: 'wallets',
    label: 'Wallets',
    short: 'Wallets',
    sub: 'Pay using Amazon Pay, PhonePe, Paytm etc.',
    Icon: Wallet,
  },
  {
    id: 'cod',
    label: 'Cash on Delivery',
    short: 'Cash on Delivery',
    sub: 'Pay in cash upon arrival',
    Icon: Truck,
  },
];

function GooglePayMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" strokeWidth="3.6" aria-hidden>
      <path d="M18.13 6.86A8 8 0 0 0 5.87 6.86" stroke="#EA4335" />
      <path d="M5.87 6.86A8 8 0 0 0 5.87 17.14" stroke="#FBBC05" />
      <path d="M5.87 17.14A8 8 0 0 0 18.13 17.14" stroke="#34A853" />
      <path d="M18.13 17.14A8 8 0 0 0 20 12H12" stroke="#4285F4" />
    </svg>
  );
}

function PhonePeMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <circle cx="16" cy="16" r="16" fill="#5F259F" />
      <text x="16" y="22.5" textAnchor="middle" fontSize="18" fontWeight="700" fill="#fff">
        ₹
      </text>
    </svg>
  );
}

function PaytmMark() {
  return (
    <svg viewBox="0 0 64 24" className="h-6 w-auto" aria-hidden>
      <text x="32" y="18" textAnchor="middle" fontSize="19" fontWeight="800" fontFamily="Inter, system-ui, sans-serif">
        <tspan fill="#00186C">pay</tspan>
        <tspan fill="#00BAF2">tm</tspan>
      </text>
    </svg>
  );
}

function AmazonPayMark() {
  return (
    <svg viewBox="0 0 64 36" className="h-8 w-auto" aria-hidden>
      <text x="32" y="14" textAnchor="middle" fontSize="14" fontWeight="700" fill="#232F3E">
        amazon
      </text>
      <path d="M8 19 Q32 30 56 18" stroke="#FF9900" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <text x="32" y="33" textAnchor="middle" fontSize="11" fontWeight="600" fill="#232F3E">
        pay
      </text>
    </svg>
  );
}

function UpiTriangles() {
  return (
    <>
      <polygon points="0,0 8,10 0,10" fill="#E8782B" />
      <polygon points="0,12 8,12 0,22" fill="#0B8A3E" />
    </>
  );
}

function BhimMark() {
  return (
    <svg viewBox="0 0 64 24" className="h-6 w-auto" aria-hidden>
      <text x="2" y="18" fontSize="17" fontWeight="800" fill="#2B2B2B" fontFamily="Inter, system-ui, sans-serif" fontStyle="italic">
        BHIM
      </text>
      <g transform="translate(52 1)">
        <UpiTriangles />
      </g>
    </svg>
  );
}

function OtherUpiMark() {
  return (
    <svg viewBox="0 0 52 24" className="h-6 w-auto" aria-hidden>
      <text x="2" y="18" fontSize="17" fontWeight="800" fill="#2B2B2B" fontFamily="Inter, system-ui, sans-serif">
        UPI
      </text>
      <g transform="translate(40 1)">
        <UpiTriangles />
      </g>
    </svg>
  );
}

const UPI_APPS = [
  { name: 'Google Pay', Mark: GooglePayMark },
  { name: 'PhonePe', Mark: PhonePeMark },
  { name: 'Paytm', Mark: PaytmMark },
  { name: 'Amazon Pay', Mark: AmazonPayMark },
  { name: 'BHIM', Mark: BhimMark },
  { name: 'Other UPI', Mark: OtherUpiMark },
];

const WALLET_APPS = UPI_APPS.filter((a) =>
  ['PhonePe', 'Paytm', 'Amazon Pay'].includes(a.name)
);

function AppChip({
  name,
  Mark,
}: {
  name: string;
  Mark: React.ComponentType;
}) {
  return (
    <li className="group flex min-w-0 flex-col items-center gap-2 rounded-md border border-white/10 bg-[#0D0F0F] p-2.5 text-center transition-all duration-200 hover:border-[#D4AF37]/60 hover:shadow-[0_0_14px_rgba(212,175,55,0.12)]">
      <span className="flex h-12 w-full items-center justify-center rounded bg-white">
        <Mark />
      </span>
      <span className="w-full truncate text-xs text-neutral-200">{name}</span>
    </li>
  );
}

function VisaMark() {
  return (
    <span className="flex h-7 w-12 items-center justify-center rounded bg-white">
      <svg viewBox="0 0 48 16" className="h-4 w-auto" aria-label="Visa">
        <text x="24" y="13" textAnchor="middle" fontSize="15" fontWeight="900" fontStyle="italic" fill="#1A1F71">
          VISA
        </text>
      </svg>
    </span>
  );
}

function MastercardMark({ dark = false }: { dark?: boolean }) {
  return (
    <span className={`flex h-7 w-12 items-center justify-center rounded ${dark ? '' : 'bg-white'}`}>
      <svg viewBox="0 0 32 20" className="h-5 w-auto" aria-label="Mastercard">
        <circle cx="11" cy="10" r="9" fill="#EB001B" />
        <circle cx="21" cy="10" r="9" fill="#F79E1B" />
        <path d="M16 2.6a9 9 0 0 1 0 14.8 9 9 0 0 1 0-14.8z" fill="#FF5F00" />
      </svg>
    </span>
  );
}

function RuPayMark() {
  return (
    <span className="flex h-7 w-14 items-center justify-center rounded bg-white">
      <svg viewBox="0 0 56 16" className="h-4 w-auto" aria-label="RuPay">
        <text x="2" y="13" fontSize="13" fontWeight="800" fontStyle="italic" fill="#1B3A8C">
          Ru<tspan fill="#F26B21">Pay</tspan>
        </text>
        <polygon points="48,2 54,8 48,8" fill="#F26B21" />
        <polygon points="48,9 54,9 48,15" fill="#0B8A3E" />
      </svg>
    </span>
  );
}

function CardBrands() {
  return (
    <div
      className="flex items-center gap-2"
      role="img"
      aria-label="Visa, Mastercard and RuPay accepted"
    >
      <VisaMark />
      <MastercardMark />
      <RuPayMark />
    </div>
  );
}

function PanelFrame({
  Icon,
  title,
  sub,
  right,
  note,
  children,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub: string;
  right?: React.ReactNode;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-[#D4AF37]/25 bg-gradient-to-b from-[#0D0F0F] to-[#080A0A]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#D4AF37]/60 text-[#E8C96A]">
            <Icon className="h-5 w-5 stroke-[1.5]" />
          </span>

          <div className="min-w-0">
            <h3 className="font-serif text-lg leading-tight text-[#F5F1E8]">{title}</h3>
            <p className="text-xs text-neutral-400 sm:text-sm">{sub}</p>
          </div>
        </div>

        {right}
      </div>

      <div className="p-4 sm:p-5">{children}</div>

      <div className="flex items-center gap-2 border-t border-white/10 bg-black/30 px-4 py-3 text-xs text-neutral-400 sm:px-5">
        <Lock className="h-3.5 w-3.5 shrink-0 text-[#E8C96A]" />
        {note}
      </div>
    </div>
  );
}

function Points({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2.5 text-sm text-neutral-200">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#E8C96A]" />
          {t}
        </li>
      ))}
    </ul>
  );
}

function CardPreview() {
  return (
    <div
      aria-hidden
      className="relative aspect-[1.6/1] w-full max-w-[230px] shrink-0 overflow-hidden rounded-xl border border-[#D4AF37]/40 bg-gradient-to-br from-[#1d1808] via-[#0b0b0b] to-[#2b2209] p-4 shadow-[0_0_28px_rgba(212,175,55,0.12)]"
    >
      <span className="block h-6 w-8 rounded-[4px] bg-gradient-to-br from-[#E8C96A] to-[#9C7A1C]" />
      <p className="mt-4 text-[13px] tracking-[0.2em] text-[#F5F1E8]/80">•••• •••• •••• ••••</p>
      <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
        <span className="font-serif text-sm tracking-wider text-[#E8C96A]">KÖVENIK</span>
        <MastercardMark dark />
      </div>
    </div>
  );
}

function MethodPanel({ id }: { id: PaymentId }) {
  const m = METHODS.find((x) => x.id === id)!;

  if (id === 'upi') {
    return (
      <PanelFrame
        Icon={m.Icon}
        title="UPI Payment"
        sub="Pay instantly using any UPI app"
        note="You will complete this payment securely after placing your order."
      >
        <ul className="grid grid-cols-2 gap-2.5 min-[420px]:grid-cols-3 lg:grid-cols-6">
          {UPI_APPS.map((a) => (
            <AppChip key={a.name} {...a} />
          ))}
        </ul>

        <ol className="mt-5 grid gap-3 border-t border-white/10 pt-4 text-xs text-neutral-300 sm:grid-cols-3">
          {[
            'Choose your UPI app',
            'Approve the request on your phone',
            'Your order is confirmed',
          ].map((t, i) => (
            <li key={t} className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/50 text-[11px] text-[#E8C96A]">
                {i + 1}
              </span>
              {t}
            </li>
          ))}
        </ol>
      </PanelFrame>
    );
  }

  if (id === 'card') {
    return (
      <PanelFrame
        Icon={m.Icon}
        title="Card Payment"
        sub="Pay securely with Credit or Debit Card"
        right={<CardBrands />}
        note="Secure encrypted payment"
      >
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <CardPreview />
          <div className="min-w-0 space-y-3">
            <p className="text-sm font-medium text-[#F5F1E8]">
              Secure card payment powered by Razorpay
            </p>
            <Points
              items={[
                'Credit and debit cards accepted',
                'Card details are entered on Razorpay’s secure checkout',
                'Never stored on KÖVENIK',
              ]}
            />
          </div>
        </div>
      </PanelFrame>
    );
  }

  if (id === 'netbanking') {
    return (
      <PanelFrame
        Icon={m.Icon}
        title="Net Banking"
        sub="All major banks supported"
        note="Secure encrypted payment"
      >
        <div className="flex items-center gap-4 rounded-md border border-white/10 bg-[#050606] p-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-[#D4AF37]/50 text-[#E8C96A]">
            <Landmark className="h-6 w-6 stroke-[1.5]" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#F5F1E8]">Select your bank at checkout</p>
            <p className="mt-0.5 text-xs text-neutral-400">
              You’ll securely select your bank in Razorpay Checkout.
            </p>
          </div>

          <ChevronRight className="h-4 w-4 shrink-0 text-[#E8C96A]" aria-hidden />
        </div>

        <div className="mt-4">
          <Points
            items={[
              'Log in with your own bank credentials',
              'No card required',
              'Your bank details are never shared with KÖVENIK',
            ]}
          />
        </div>
      </PanelFrame>
    );
  }

  if (id === 'wallets') {
    return (
      <PanelFrame
        Icon={m.Icon}
        title="Wallets"
        sub="Pay securely using supported wallets"
        note="Secure encrypted payment"
      >
        <ul className="grid grid-cols-2 gap-2.5 min-[420px]:grid-cols-3 sm:max-w-md">
          {WALLET_APPS.map((a) => (
            <AppChip key={a.name} {...a} />
          ))}
        </ul>
      </PanelFrame>
    );
  }

  return (
    <PanelFrame
      Icon={m.Icon}
      title="Cash on Delivery"
      sub="Pay in cash upon arrival"
      note="No advance online payment is required."
    >
      <div className="flex items-center gap-4 rounded-md border border-white/10 bg-[#050606] p-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/50 text-[#E8C96A]">
          <Truck className="h-7 w-7 stroke-[1.25]" />
        </span>

        <div className="min-w-0">
          <p className="text-sm font-medium text-[#F5F1E8]">
            No advance online payment required.
          </p>
          <p className="mt-0.5 text-xs text-neutral-400">Pay when your order arrives.</p>
        </div>
      </div>
    </PanelFrame>
  );
}

function PaymentSelector({
  value,
  onChange,
}: {
  value: PaymentId;
  onChange: (v: PaymentId) => void;
}) {
  return (
    <>
      <div className="hidden md:block">
        <div role="tablist" aria-label="Payment method" className="grid grid-cols-5 gap-2">
          {METHODS.map(({ id, short, Icon }) => {
            const on = value === id;

            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => onChange(id)}
                className={`flex flex-col items-center gap-2 rounded-md border px-2 py-4 text-xs font-medium transition-all duration-200 ${focusRing} ${
                  on
                    ? 'border-[#D4AF37] bg-[#14120B] text-[#F5F1E8] shadow-[0_0_18px_rgba(212,175,55,0.2)]'
                    : 'border-white/10 bg-[#050606] text-neutral-400 hover:border-[#D4AF37]/40 hover:text-neutral-200'
                }`}
              >
                <Icon className={`h-5 w-5 stroke-[1.5] ${on ? 'text-[#E8C96A]' : ''}`} />
                {short}
              </button>
            );
          })}
        </div>

        <motion.div
          key={value}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-4"
        >
          <MethodPanel id={value} />
        </motion.div>
      </div>

      <div role="radiogroup" aria-label="Payment method" className="space-y-2 md:hidden">
        {METHODS.map(({ id, label, sub, Icon }) => {
          const on = value === id;

          return (
            <div
              key={id}
              className={`rounded-md border transition-colors duration-200 ${
                on
                  ? 'border-[#D4AF37] shadow-[0_0_16px_rgba(212,175,55,0.15)]'
                  : 'border-white/10'
              } bg-[#050606]`}
            >
              <button
                type="button"
                role="radio"
                aria-checked={on}
                aria-expanded={on}
                onClick={() => onChange(id)}
                className={`flex w-full items-center gap-3 rounded-md px-4 py-4 text-left ${focusRing}`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 stroke-[1.5] ${
                    on ? 'text-[#E8C96A]' : 'text-neutral-300'
                  }`}
                />

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-[#F5F1E8]">
                    {id === 'card' ? 'Card' : label}
                  </span>
                  {!on && (
                    <span className="block truncate text-xs text-neutral-500">{sub}</span>
                  )}
                </span>

                <ChevronRight
                  className={`h-4 w-4 shrink-0 text-[#E8C96A] transition-transform duration-200 ${
                    on ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {on && (
                <div className="border-t border-white/10 p-3">
                  <MethodPanel id={id} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

type MembershipProps = {
  price?: string;
  period?: string;
  action?: {
    label: string;
    onClick: () => void;
    pressed?: boolean;
  };
};

function MembershipCard({ price, period, action }: MembershipProps) {
  const [open, setOpen] = useState(false);

  const benefits = [
    'Exclusive member offers',
    'Early access to new drops',
    'Premium benefits',
    'Member-only experiences',
  ];

  return (
    <section
      aria-label="KÖVENIK Membership"
      className="relative overflow-hidden rounded-lg border border-[#D4AF37]/40 bg-gradient-to-br from-[#0A0C0C] via-[#0A0C0C] to-[#1a1505] shadow-[0_0_30px_rgba(212,175,55,0.07)]"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="membership-body"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-4 px-5 py-4 text-left md:pointer-events-none md:px-7 md:pt-6 ${focusRing}`}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/70 text-[#E8C96A]">
          <Crown className="h-5 w-5 stroke-[1.5]" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block font-serif text-xl text-[#F5F1E8]">KÖVENIK Membership</span>
          <span className="block text-xs text-neutral-400 sm:text-sm">
            Unlock the full KÖVENIK experience
          </span>
        </span>

        {price && (
          <span className="hidden text-right sm:block">
            <span className="block text-lg font-semibold text-[#E8C96A]">{price}</span>
            {period && <span className="block text-xs text-neutral-400">{period}</span>}
          </span>
        )}

        <ChevronRight
          className={`h-4 w-4 shrink-0 text-[#E8C96A] transition-transform duration-200 md:hidden ${
            open ? 'rotate-90' : ''
          }`}
        />
      </button>

      <div
        id="membership-body"
        className={`grid transition-[grid-template-rows] duration-300 ease-out md:grid-rows-[1fr] ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-5 border-t border-white/10 px-5 pb-5 pt-4 md:px-7 md:pb-6">
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-sm text-neutral-200">
                  <Check className="h-4 w-4 shrink-0 text-[#E8C96A]" />
                  {b}
                </li>
              ))}
            </ul>

            {price && (
              <p className="text-sm text-neutral-300 sm:hidden">
                <span className="font-semibold text-[#E8C96A]">{price}</span>
                {period && <span className="text-neutral-400"> {period}</span>}
              </p>
            )}

            {action && (
              <button
                type="button"
                onClick={action.onClick}
                aria-pressed={action.pressed}
                className={`w-full rounded-md border px-5 py-3 text-xs font-semibold tracking-[0.15em] transition-all duration-200 sm:w-auto ${focusRing} ${
                  action.pressed
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#E8C96A]'
                    : 'border-[#D4AF37]/60 text-[#E8C96A] hover:bg-[#D4AF37]/10'
                }`}
              >
                {action.label.toUpperCase()}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function AddressFormModal({
  open,
  loading,
  editingId,
  form,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  loading: boolean;
  editingId: string | null;
  form: AddressForm;
  onChange: (patch: Partial<AddressForm>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  if (!open || typeof document === 'undefined') return null;

  const fields = [
    ['name', 'Full Name', 'e.g. Deep Jadav', 'text'],
    ['phone', 'Phone Number', '+91 98765 43210', 'tel'],
    ['pincode', 'Pincode', '380001', 'text'],
    ['city', 'City', 'Ahmedabad', 'text'],
    ['state', 'State', 'Gujarat', 'text'],
  ] as const;

  const modal = (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 px-4 py-6 sm:px-6 backdrop-blur-[3px] overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-modal-title"
        className="my-auto max-h-[84vh] w-full max-w-xl overflow-y-auto rounded-xl border border-[#D4AF37]/40 bg-[#0A0C0C] shadow-[0_0_50px_rgba(0,0,0,0.55)] ring-1 ring-white/5"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0A0C0C]/95 px-5 py-4 backdrop-blur sm:px-6">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.22em] text-[#D4AF37]">
              {editingId ? 'UPDATE DESTINATION' : 'NEW DESTINATION'}
            </p>
            <h3 id="address-modal-title" className="mt-0.5 font-serif text-xl sm:text-2xl text-[#F5F1E8]">
              {editingId ? 'Edit Address' : 'Add Address'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-neutral-400 hover:border-[#D4AF37]/50 hover:text-[#E8C96A] ${focusRing}`}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            // This form is rendered through a React portal. React events from
            // portals still bubble through the React tree, so without stopping
            // propagation the parent checkout <form> could also run its
            // onSubmit handler and incorrectly show "Order Placed".
            e.preventDefault();
            e.stopPropagation();
            onSubmit(e);
          }}
          className="space-y-4 p-5 sm:p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(([name, label, placeholder, type]) => (
              <label key={name} className="space-y-2">
                <span className="text-xs font-medium text-[#E8C96A]">
                  {label} <span aria-hidden>*</span>
                </span>
                <input
                  required
                  type={type}
                  value={String(form[name])}
                  onChange={(e) => onChange({ [name]: e.target.value } as Partial<AddressForm>)}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-white/15 bg-[#050606] px-4 py-3 text-sm text-[#F5F1E8] placeholder:text-neutral-500 outline-none transition focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/60"
                />
              </label>
            ))}
          </div>

          <label className="space-y-2">
            <span className="text-xs font-medium text-[#E8C96A]">
              Address <span aria-hidden>*</span>
            </span>
            <textarea
              required
              value={form.address}
              onChange={(e) => onChange({ address: e.target.value })}
              placeholder="House/Flat No., Street Name, Area"
              rows={3}
              className="w-full resize-none rounded-lg border border-white/15 bg-[#050606] px-4 py-3 text-sm text-[#F5F1E8] placeholder:text-neutral-500 outline-none transition focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/60"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="space-y-2">
              <span className="text-xs font-medium text-[#E8C96A]">Address Type</span>
              <select
                value={form.address_type}
                onChange={(e) => onChange({ address_type: e.target.value })}
                className="w-full rounded-lg border border-white/15 bg-[#050606] px-4 py-3 text-sm text-[#F5F1E8] outline-none focus:border-[#D4AF37]"
              >
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label className="flex items-center gap-3 pb-2 text-sm text-neutral-300">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => onChange({ is_default: e.target.checked })}
                className="h-4 w-4 accent-[#D4AF37]"
              />
              Make Default
            </label>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-md border border-white/15 px-5 py-3 text-xs font-semibold tracking-[0.15em] text-neutral-300 hover:border-white/30 ${focusRing}`}
            >
              CANCEL
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-b from-[#E8C96A] to-[#C9A227] px-6 py-3 text-xs font-bold tracking-[0.15em] text-[#0A0A0A] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? 'SAVE CHANGES' : 'SAVE ADDRESS'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  // IMPORTANT: The checkout page itself is a <form>. This modal is rendered
  // through a portal so its own <form> is never nested inside the checkout
  // form, which would cause the browser to submit the wrong form and make
  // SAVE ADDRESS appear to do nothing.
  return createPortal(modal, document.body);
}

function AddressManager({
  selectedAddressId,
  onSelect,
}: {
  selectedAddressId: string | null;
  onSelect: (address: Address | null) => void;
}) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<AddressForm>({
    name: '',
    phone: '',
    pincode: '',
    address: '',
    city: '',
    state: '',
    address_type: 'Home',
    is_default: false,
  });

  const patchForm = (patch: Partial<AddressForm>) =>
    setForm((current) => ({ ...current, ...patch }));

  const loadAddresses = async (preferredId?: string | null) => {
    setLoading(true);
    setError('');

    try {
      const data = await apiRequest('/api/addresses');
      const next = unwrap<Address[]>(data, ['addresses', 'data']) || [];

      setAddresses(next);

      const preferred =
        preferredId && next.find((a) => a.id === preferredId);

      const defaultAddress = next.find((a) => a.is_default);
      const first = next[0];

      const selected =
        preferred || defaultAddress || first || null;

      onSelect(selected);
    } catch (err: any) {
      setError(
        err?.message === 'AUTH_REQUIRED'
          ? 'Please sign in to use saved addresses.'
          : err?.message || 'Unable to load saved addresses.'
      );
      setAddresses([]);
      onSelect(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAddresses(selectedAddressId);
    // We intentionally only load once when checkout mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm({
      name: '',
      phone: '',
      pincode: '',
      address: '',
      city: '',
      state: '',
      address_type: 'Home',
      is_default: addresses.length === 0,
    });
    setModalOpen(true);
  };

  const openEdit = (address: Address) => {
    setEditingId(address.id);
    setForm({
      name: address.name,
      phone: address.phone,
      pincode: address.pincode,
      address: address.address,
      city: address.city,
      state: address.state,
      address_type: address.address_type || 'Home',
      is_default: Boolean(address.is_default),
    });
    setModalOpen(true);
  };

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        pincode: form.pincode,
        address: form.address,
        city: form.city,
        state: form.state,
        addressType: form.address_type,
        isDefault: form.is_default,
      };

      let preferredAddressId: string | null = editingId;

      if (editingId) {
        await apiRequest(`/api/addresses/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        const created = await apiRequest('/api/addresses', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        const createdAddress =
          created?.address || created?.data || created;

        preferredAddressId =
          createdAddress?.id || createdAddress?._id || null;
      }

      setModalOpen(false);
      await loadAddresses(preferredAddressId);
    } catch (err: any) {
      setError(err?.message || 'Unable to save address.');
    } finally {
      setSaving(false);
    }
  };

  const removeAddress = async (id: string) => {
    const address = addresses.find((a) => a.id === id);
    if (!address) return;

    // Production UX: delete immediately without browser confirm/alert/toast.
    // The delete button is disabled while the request is in flight.
    setSaving(true);
    setError('');

    try {
      await apiRequest(`/api/addresses/${id}`, {
        method: 'DELETE',
      });

      const remaining = addresses.filter((a) => a.id !== id);
      setAddresses(remaining);

      const next =
        remaining.find((a) => a.is_default) ||
        remaining[0] ||
        null;

      onSelect(next);
    } catch (err: any) {
      setError(err?.message || 'Unable to delete address.');
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (id: string) => {
    setSaving(true);
    setError('');

    try {
      await apiRequest(`/api/addresses/${id}/default`, {
        method: 'PATCH',
      });

      const data = await apiRequest('/api/addresses');
      const next = unwrap<Address[]>(data, ['addresses', 'data']) || [];

      setAddresses(next);

      const selected =
        next.find((a) => a.id === selectedAddressId) ||
        next.find((a) => a.is_default) ||
        next[0] ||
        null;

      onSelect(selected);
    } catch (err: any) {
      setError(err?.message || 'Unable to update default address.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-serif text-xl text-[#F5F1E8]">Saved Addresses</h3>
            <p className="mt-1 text-xs text-neutral-400">
              Select a delivery address or manage your saved destinations.
            </p>
          </div>

          <span className="text-xs text-neutral-500">
            {addresses.length} {addresses.length === 1 ? 'address' : 'addresses'}
          </span>
        </div>

        {error && (
          <div className="rounded-md border border-red-500/25 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[160px] items-center justify-center rounded-md border border-white/10 bg-[#050606]">
            <Loader2 className="h-6 w-6 animate-spin text-[#E8C96A]" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#D4AF37]/30 bg-[#050606] px-5 py-8 text-center">
            <MapPin className="mx-auto h-7 w-7 text-[#E8C96A]" />
            <p className="mt-3 font-serif text-lg text-[#F5F1E8]">No saved address yet</p>
            <p className="mt-1 text-sm text-neutral-400">
              Add a delivery address and it will stay available on your profile and future checkouts.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {addresses.map((address) => {
              const selected = selectedAddressId === address.id;

              return (
                <div
                  key={address.id}
                  className={`rounded-md border bg-[#050606] transition-all ${
                    selected
                      ? 'border-[#D4AF37] shadow-[0_0_18px_rgba(212,175,55,0.13)]'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(address);
                    }}
                    className={`w-full p-4 text-left sm:p-5 ${focusRing}`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          selected
                            ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                            : 'border-white/20'
                        }`}
                      >
                        {selected && <Check className="h-3 w-3 text-[#E8C96A]" />}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold uppercase tracking-[0.12em] text-[#F5F1E8]">
                            {address.address_type || 'Address'}
                          </span>

                          {address.is_default && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/40 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-[#E8C96A]">
                              <Star className="h-2.5 w-2.5" />
                              DEFAULT
                            </span>
                          )}

                          {selected && (
                            <span className="text-[10px] font-semibold tracking-[0.12em] text-[#E8C96A]">
                              SELECTED
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm font-medium text-[#F5F1E8]">
                          {address.name}
                        </p>

                        <p className="mt-1 text-xs text-neutral-400">
                          {address.phone}
                        </p>

                        <p className="mt-2 text-sm leading-6 text-neutral-300">
                          {address.address}
                          <br />
                          {address.city}, {address.state} - {address.pincode}
                        </p>
                      </div>
                    </div>
                  </button>

                  <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 px-4 py-3 sm:px-5">
                    {!address.is_default && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void makeDefault(address.id);
                        }}
                        disabled={saving}
                        className={`inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-[10px] font-semibold tracking-[0.12em] text-neutral-300 hover:border-[#D4AF37]/50 hover:text-[#E8C96A] disabled:opacity-50 ${focusRing}`}
                      >
                        <Star className="h-3.5 w-3.5" />
                        MAKE DEFAULT
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(address);
                      }}
                      className={`inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-[10px] font-semibold tracking-[0.12em] text-neutral-300 hover:border-[#D4AF37]/50 hover:text-[#E8C96A] ${focusRing}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      EDIT
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void removeAddress(address.id);
                      }}
                      disabled={saving}
                      className={`inline-flex items-center gap-2 rounded-md border border-red-500/20 px-3 py-2 text-[10px] font-semibold tracking-[0.12em] text-red-300 hover:border-red-500/40 disabled:opacity-50 ${focusRing}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      DELETE
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openAdd();
          }}
          className={`group flex w-full items-center justify-center gap-3 rounded-md border border-[#D4AF37]/55 bg-gradient-to-r from-[#15130B] via-[#0A0C0C] to-[#15130B] px-5 py-4 text-sm font-semibold tracking-[0.14em] text-[#E8C96A] shadow-[0_0_20px_rgba(212,175,55,0.07)] transition hover:border-[#D4AF37] hover:bg-[#14120B] ${focusRing}`}
        >
          <Plus className="h-5 w-5 transition-transform duration-200 group-hover:rotate-90" />
          ADD NEW ADDRESS
        </button>
      </div>

      <AddressFormModal
        open={modalOpen}
        loading={saving}
        editingId={editingId}
        form={form}
        onChange={patchForm}
        onClose={() => setModalOpen(false)}
        onSubmit={saveAddress}
      />
    </>
  );
}

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const [placed, setPlaced] = useState(false);
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentId>('cod');
  const [selectedAddress, setSelectedAddress] =
    useState<Address | null>(null);

  const total = getCartSubtotal(items);
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  const trust = [
    { Icon: Truck, title: 'Free Shipping', sub: 'On all orders' },
    { Icon: ShieldCheck, title: 'Secure Payment', sub: 'Encrypted checkout' },
    { Icon: RotateCcw, title: 'Easy Returns', sub: 'Hassle-free' },
    { Icon: Headset, title: 'Premium Support', sub: "We're here to help" },
  ];

  if (placed) {
    return (
      <Shell>
        <div className="flex min-h-screen items-center justify-center px-5 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-md rounded-lg border border-[#D4AF37]/40 bg-[#0A0C0C] p-8 text-center shadow-[0_0_40px_rgba(212,175,55,0.08)] sm:p-12"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#D4AF37]/60 text-[#E8C96A]">
              <CheckCircle2 className="h-8 w-8 stroke-[1.5]" />
            </div>

            <p className="text-xs font-medium tracking-[0.2em] text-neutral-400">
              ORDER CONFIRMATION
            </p>

            <h1 className="mb-3 mt-2 font-serif text-3xl text-[#F5F1E8]">
              Order Placed
            </h1>

            <p className="mb-8 text-sm leading-relaxed text-neutral-400">
              Thank you for shopping with KÖVENIK. Your order details and tracking link have
              been dispatched to your email.
            </p>

            <Link
              href="/shop"
              className={`inline-flex w-full items-center justify-center rounded-md bg-gradient-to-b from-[#E8C96A] to-[#C9A227] py-4 text-sm font-semibold tracking-[0.15em] text-[#0A0A0A] transition hover:brightness-110 active:scale-[0.99] ${focusRing}`}
            >
              CONTINUE SHOPPING
            </Link>
          </motion.div>
        </div>
      </Shell>
    );
  }

  if (!items.length) {
    return (
      <Shell>
        <div className="flex min-h-screen items-center justify-center px-5 py-20">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md rounded-lg border border-dashed border-[#D4AF37]/40 bg-[#0A0C0C] p-10 text-center"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/15">
              <ShoppingBag className="h-6 w-6 stroke-[1.5] text-[#E8C96A]" />
            </div>

            <h1 className="mb-2 font-serif text-2xl text-[#F5F1E8]">
              Your Cart is Empty
            </h1>

            <p className="mb-6 text-sm text-neutral-400">
              Please add items to your shopping bag before proceeding to checkout.
            </p>

            <Link
              href="/shop"
              className={`inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-[#E8C96A] to-[#C9A227] px-8 py-3.5 text-sm font-semibold tracking-[0.15em] text-[#0A0A0A] transition hover:brightness-110 ${focusRing}`}
            >
              SHOP NOW
            </Link>
          </motion.div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-[1280px] px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-8 sm:px-8 lg:px-12 lg:pb-16 lg:pt-12">
        <Link
          href="/cart"
          className={`inline-flex items-center gap-2 rounded text-xs font-semibold tracking-[0.15em] text-neutral-300 transition-colors hover:text-[#E8C96A] ${focusRing}`}
        >
          <ArrowLeft className="h-3.5 w-3.5 text-[#E8C96A]" />
          BACK TO CART
        </Link>

        <header className="mb-8 mt-5 flex flex-col gap-6 border-b border-white/10 pb-8 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-serif text-4xl text-[#F5F1E8] sm:text-5xl">Checkout</h1>
            <p className="mt-2 text-sm text-neutral-300 sm:text-base">
              Complete your order and wear beyond ordinary.
            </p>
          </div>

          <StepIndicator />
        </header>

        <form
          id="checkout-form"
          onSubmit={(e) => {
            // Guard against React portal events bubbling from the address modal.
            // Only the checkout form itself is allowed to enter the order flow.
            if (e.currentTarget !== e.target) return;

            e.preventDefault();

            if (!selectedAddress) {
              window.alert('Please add or select a delivery address first.');
              return;
            }

            // KEEP YOUR EXISTING PAYMENT / ORDER LOGIC HERE.
            // The address selected above is now the delivery address for checkout.
            clearCart();
            setPlaced(true);
          }}
          className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_420px]"
        >
          <div className="min-w-0 space-y-8">
            <section className={cardClass} aria-labelledby="delivery-heading">
              <CardTitle
                index={1}
                title="Delivery Details"
                note="We deliver across India"
                icon={<Truck className="h-4 w-4 text-[#E8C96A]" />}
              />

              <span id="delivery-heading" className="sr-only">
                Delivery Details
              </span>

              <AddressManager
                selectedAddressId={selectedAddress?.id || null}
                onSelect={setSelectedAddress}
              />

              {selectedAddress && (
                <div className="mt-4 flex items-start gap-2 rounded-md border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-4 py-3 text-xs text-neutral-300">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#E8C96A]" />
                  <span>
                    Delivering to{' '}
                    <strong className="font-medium text-[#F5F1E8]">
                      {selectedAddress.address_type || 'Address'}
                    </strong>{' '}
                    — {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                  </span>
                </div>
              )}
            </section>

            <section className={cardClass} aria-labelledby="payment-heading">
              <CardTitle
                index={2}
                title="Payment Method"
                note="100% Secure Payments"
                icon={<ShieldCheck className="h-4 w-4 text-[#E8C96A]" />}
              />

              <span id="payment-heading" className="sr-only">
                Payment Method
              </span>

              <p className="-mt-3 mb-5 text-sm text-neutral-400">
                Choose your preferred payment option
              </p>

              <PaymentSelector
                value={selectedPayment}
                onChange={setSelectedPayment}
              />
            </section>

            <MembershipCard />
          </div>

          <aside className="min-w-0 space-y-6 lg:sticky lg:top-8">
            <div className={cardClass}>
              <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-5 w-5 stroke-[1.5] text-[#E8C96A]" />
                  <h2 className="font-serif text-2xl">Order Summary</h2>
                </div>

                <span className="text-xs text-neutral-400">
                  {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              <ul className="max-h-72 divide-y divide-white/10 overflow-y-auto pr-1">
                {items.map((item) => (
                  <li
                    key={`${item.productId}-${item.size}-${item.color}`}
                    className="flex items-center gap-4 py-4"
                  >
                    <div className="h-[72px] w-14 shrink-0 overflow-hidden rounded border border-white/10 bg-[#111]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium text-[#F5F1E8]">
                        {item.name}
                      </p>

                      <p className="mt-1 text-xs text-neutral-400">
                        Size: {item.size}{' '}
                        <span aria-hidden className="mx-1 text-white/20">
                          |
                        </span>{' '}
                        Qty: {item.quantity}
                      </p>
                    </div>

                    <span className="shrink-0 text-sm font-semibold text-[#F5F1E8]">
                      {formatINR(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <dl className="mt-2 space-y-3 border-t border-white/10 pt-5 text-sm">
                <div className="flex justify-between text-neutral-300">
                  <dt>Items Count</dt>
                  <dd className="font-medium text-[#F5F1E8]">{itemCount} unit(s)</dd>
                </div>

                <div className="flex justify-between text-neutral-300">
                  <dt>Subtotal</dt>
                  <dd className="font-medium text-[#F5F1E8]">{formatINR(total)}</dd>
                </div>

                <div className="flex justify-between text-neutral-300">
                  <dt>Shipping</dt>
                  <dd className="text-xs font-semibold tracking-wider text-emerald-400">
                    COMPLIMENTARY
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex items-baseline justify-between border-t border-white/10 pt-5">
                <span className="font-serif text-lg">Total Payable</span>
                <strong className="text-2xl font-semibold text-[#E8C96A]">
                  {formatINR(total)}
                </strong>
              </div>

              <button
                type="submit"
                className={`mt-6 hidden w-full items-center justify-center gap-3 rounded-md bg-gradient-to-b from-[#E8C96A] to-[#C9A227] py-4 text-sm font-bold tracking-[0.18em] text-[#0A0A0A] shadow-[0_0_24px_rgba(212,175,55,0.25)] transition-all duration-200 hover:brightness-110 active:scale-[0.99] lg:flex ${focusRing}`}
              >
                <Lock className="h-4 w-4" />
                PLACE ORDER
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 border-t border-white/10 pt-4 text-[11px] tracking-wider text-neutral-400">
                <ShieldCheck className="h-3.5 w-3.5 text-[#E8C96A]" />
                256-BIT ENCRYPTED SECURE CHECKOUT
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#0A0C0C] px-4 py-6">
              <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                {trust.map(({ Icon, title, sub }) => (
                  <li key={title} className="flex flex-col items-center text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/50 text-[#E8C96A]">
                      <Icon className="h-[18px] w-[18px] stroke-[1.5]" />
                    </span>

                    <span className="mt-2 text-[11px] font-medium text-[#F5F1E8]">
                      {title}
                    </span>

                    <span className="text-[10px] text-neutral-400">{sub}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex items-center gap-3 text-[#E8C96A]/70" aria-hidden>
                <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
                <Crown className="h-4 w-4" />
                <span className="text-[9px] tracking-[0.3em]">WEAR BEYOND ORDINARY</span>
                <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
              </div>
            </div>
          </aside>
        </form>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D4AF37]/30 bg-[#050505]/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-[640px] items-center justify-between gap-4 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
          <div className="min-w-0">
            <p className="text-[11px] text-neutral-400">Total Payable</p>
            <p className="truncate text-xl font-semibold text-[#E8C96A]">{formatINR(total)}</p>
          </div>

          <button
            type="submit"
            form="checkout-form"
            className={`flex shrink-0 items-center gap-2 rounded-md bg-gradient-to-b from-[#E8C96A] to-[#C9A227] px-5 py-3.5 text-xs font-bold tracking-[0.15em] text-[#0A0A0A] transition active:scale-[0.98] ${focusRing}`}
          >
            <Lock className="h-3.5 w-3.5" />
            PLACE ORDER
          </button>
        </div>
      </div>
    </Shell>
  );
}
