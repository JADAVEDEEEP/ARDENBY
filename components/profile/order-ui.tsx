'use client';

import { useEffect, useState } from 'react';
import { Check, CheckCircle2, Clock, PackageCheck, ShoppingBag, Truck, Undo2, XCircle } from 'lucide-react';
import { profileRequest, unwrap } from '../../services/profile-api';

/* Shared order presentation for the Overview and My Orders sections.
   Everything shown here comes from the real order API. */

export type OrderItem = {
  id?: string;
  product_name: string;
  product_image?: string | null;
  size?: string;
  color?: string;
  quantity: number;
  unit_price?: number | string;
};

export type OrderDetail = {
  id: string;
  order_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number | string;
  shipping_amount: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  coupon_code?: string | null;
  shipping_name?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_pincode?: string;
  created_at: string;
  updated_at?: string;
  items: OrderItem[];
};

export const fmtDate = (raw?: string | null, withYear = false) => {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  });
};

/* ---------- status ---------- */

export function statusMeta(status: string) {
  const s = String(status).toLowerCase();
  if (s === 'cancelled' || s === 'canceled') return { tone: 'danger', Icon: XCircle };
  if (s === 'returned') return { tone: 'muted', Icon: Undo2 };
  if (s === 'delivered') return { tone: 'outline', Icon: CheckCircle2 };
  if (s === 'shipped' || s === 'out for delivery') return { tone: 'dark', Icon: Truck };
  if (s === 'packed') return { tone: 'outline', Icon: PackageCheck };
  return { tone: 'dashed', Icon: Clock };
}

export function OrderStatusChip({ status }: { status: string }) {
  const { tone, Icon } = statusMeta(status);
  return (
    <span className="kv-status" data-tone={tone}>
      <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
      {status}
    </span>
  );
}

/* ---------- tracking ---------- */

export const TRACK_STEPS = ['Ordered', 'Packed', 'Shipped', 'Out for delivery', 'Delivered'] as const;

/** Index of the current step, or -1 when the order is cancelled / returned. */
export function trackIndex(status: string) {
  const s = String(status).toLowerCase();
  if (s === 'cancelled' || s === 'canceled' || s === 'returned') return -1;
  if (s === 'delivered') return 4;
  if (s === 'out for delivery') return 3;
  if (s === 'shipped') return 2;
  if (s === 'packed') return 1;
  return 0;
}

export function TrackingTimeline({ order }: { order: Pick<OrderDetail, 'status' | 'created_at' | 'updated_at'> }) {
  const current = trackIndex(order.status);
  if (current < 0) return null;

  // Only dates we really have: placed date, and the last update for the current step.
  const dateFor = (i: number) => {
    if (i === 0) return fmtDate(order.created_at);
    if (i === current) return fmtDate(order.updated_at);
    return null;
  };

  return (
    <>
      {/* desktop / tablet: horizontal */}
      <ol className="hidden grid-cols-5 sm:grid" aria-label="Order tracking">
        {TRACK_STEPS.map((step, i) => {
          const done = i < current;
          const isCurrent = i === current;
          const reached = done || isCurrent;
          return (
            <li key={step} className="relative flex flex-col items-center text-center" aria-current={isCurrent ? 'step' : undefined}>
              {i > 0 && (
                <span
                  aria-hidden
                  className={`absolute right-1/2 top-[13px] h-[2px] w-full ${reached ? 'bg-[#111111]' : 'bg-[#E5E5E5]'}`}
                />
              )}
              <span
                className={`relative z-10 flex h-[28px] w-[28px] items-center justify-center rounded-full border-2 bg-white ${
                  isCurrent ? 'border-[#EF3535] ring-4 ring-[#EF3535]/20' : done ? 'border-[#111111] bg-[#111111]' : 'border-[#BDBDBD]'
                }`}
              >
                {reached && <Check className={`h-4 w-4 ${done ? 'text-white' : 'text-[#111111]'}`} strokeWidth={3} />}
              </span>
              <span className={`mt-2 text-[15px] ${reached ? 'font-bold text-[#111111]' : 'text-[#666666]'}`}>{step}</span>
              <span className="min-h-[20px] text-[14px] text-[#666666]">{dateFor(i) ?? ''}</span>
            </li>
          );
        })}
      </ol>

      {/* mobile: vertical */}
      <ol className="sm:hidden" aria-label="Order tracking">
        {TRACK_STEPS.map((step, i) => {
          const done = i < current;
          const isCurrent = i === current;
          const reached = done || isCurrent;
          const last = i === TRACK_STEPS.length - 1;
          return (
            <li key={step} className="relative flex gap-3 pb-5 last:pb-0" aria-current={isCurrent ? 'step' : undefined}>
              {!last && (
                <span
                  aria-hidden
                  className={`absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-[2px] ${i < current ? 'bg-[#111111]' : 'bg-[#E5E5E5]'}`}
                />
              )}
              <span
                className={`relative z-10 flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full border-2 bg-white ${
                  isCurrent ? 'border-[#EF3535] ring-4 ring-[#EF3535]/20' : done ? 'border-[#111111] bg-[#111111]' : 'border-[#BDBDBD]'
                }`}
              >
                {reached && <Check className={`h-4 w-4 ${done ? 'text-white' : 'text-[#111111]'}`} strokeWidth={3} />}
              </span>
              <span className="min-w-0 pt-0.5">
                <span className={`block text-[16px] ${reached ? 'font-bold text-[#111111]' : 'text-[#666666]'}`}>
                  {step}
                  {isCurrent && <span className="ml-2 text-[14px] font-semibold text-[#C8211F]">Current</span>}
                </span>
                {dateFor(i) && <span className="block text-[14px] text-[#666666]">{dateFor(i)}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </>
  );
}

/* ---------- thumbnails ---------- */

export function Thumb({ src, alt, size = 56 }: { src?: string | null; alt?: string; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-[2px] border border-[#E5E5E5] bg-[#F5F5F5]"
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt || 'Order item'} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <ShoppingBag className="h-4 w-4 text-[#666666]" strokeWidth={1.7} />
      )}
    </span>
  );
}

/* ---------- details cache ---------- */

const cache = new Map<string, OrderDetail>();

/** The order list API has no line items, so read each order's detail from the existing order API. */
export function useOrderDetails(ids: string[]) {
  const [details, setDetails] = useState<Record<string, OrderDetail>>(() =>
    Object.fromEntries(ids.filter((id) => cache.has(id)).map((id) => [id, cache.get(id)!]))
  );
  const key = ids.join('|');

  useEffect(() => {
    let alive = true;
    ids.forEach(async (id) => {
      try {
        const data = await profileRequest(`/api/orders/${encodeURIComponent(id)}`);
        const order = unwrap<OrderDetail>(data, ['order', 'data']);
        if (!order || !alive) return;
        cache.set(id, order);
        setDetails((d) => ({ ...d, [id]: order }));
      } catch {
        /* items are optional; the order card still renders */
      }
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return details;
}
