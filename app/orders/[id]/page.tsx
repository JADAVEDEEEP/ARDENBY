'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Package } from 'lucide-react';
import { apiUrl } from '@/lib/api-url';
import { formatINR } from '@/lib/format';
import { CustomerAuthGate } from '@/components/auth/customer-auth-gate';
import { CancelSection } from '@/components/orders/cancel-order';
import { ReturnSection } from '@/components/orders/return-request';

type OrderItem = {
  id: string;
  product_name: string;
  product_image?: string | null;
  size: string;
  color: string;
  quantity: number;
  unit_price: number | string;
  unit_mrp: number | string;
  /** Units of this line cancelled / in a return (0 when none). */
  cancelled_quantity?: number;
  returned_quantity?: number;
};

type OrderDetail = {
  id: string;
  order_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number | string;
  shipping_amount: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  cod_fee?: number | string;
  cod_fee_tax?: number | string;
  total_amount: number | string;
  coupon_code?: string | null;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  created_at: string;
  items: OrderItem[];
};

const PANEL =
  'rounded-2xl border border-[#E53935]/20 bg-[#F7F7F7] p-5 sm:p-6';
const LABEL = 'text-[10px] font-semibold uppercase tracking-[0.2em] text-[#E53935]';

function OrderDetailPageView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (isCancelled: () => boolean = () => false) => {
      const token = localStorage.getItem('ardenby_token');

      if (!token) {
        router.replace('/profile');
        return;
      }

      try {
        const response = await fetch(apiUrl(`/api/orders/${encodeURIComponent(id)}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
          // Expired / revoked session: sign out so the page asks to sign in again.
          localStorage.removeItem('ardenby_token');
          window.dispatchEvent(new Event('ardenby-auth-changed'));
          return;
        }

        if (!response.ok) {
          throw new Error(data?.message || 'Unable to load this order.');
        }

        if (!isCancelled()) setOrder(data.order);
      } catch (err) {
        if (!isCancelled()) {
          setError(err instanceof Error ? err.message : 'Unable to load this order.');
        }
      } finally {
        if (!isCancelled()) setLoading(false);
      }
    },
    [id, router]
  );

  useEffect(() => {
    let cancelled = false;
    void load(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [load]);

  return (
    <main className="min-h-screen bg-[#FFFFFF] px-4 pb-16 pt-8 text-[#111111] sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.15em] text-[#111111]/70 transition-colors hover:text-[#E53935]"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-[#E53935]" />
          BACK TO ACCOUNT
        </Link>

        {loading && (
          <div className="flex justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-[#E53935]" />
          </div>
        )}

        {!loading && error && (
          <div className={`${PANEL} mt-8 text-center`}>
            <Package className="mx-auto h-8 w-8 text-[#E53935]" strokeWidth={1.4} />
            <p className="mt-3 text-sm text-[#111111]/70">{error}</p>
          </div>
        )}

        {order && (
          <div className="mt-6 space-y-5">
            <header>
              <p className={LABEL}>Order</p>
              <h1 className="mt-1 font-serif text-3xl sm:text-4xl">{order.order_number}</h1>
              <p className="mt-1 text-xs text-[#111111]/55">
                Placed on{' '}
                {new Date(order.created_at).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </header>

            <section className={`${PANEL} grid grid-cols-2 gap-4 sm:grid-cols-3`}>
              <div>
                <p className={LABEL}>Status</p>
                <p className="mt-1 text-sm">{order.status}</p>
              </div>
              <div>
                <p className={LABEL}>Payment</p>
                <p className="mt-1 text-sm">
                  {String(order.payment_method).toLowerCase() === 'cod'
                    ? 'Cash on delivery'
                    : 'Online'}
                  {' · '}
                  {String(order.status).toLowerCase() === 'cancelled' ? 'Cancelled' : order.payment_status}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className={LABEL}>Deliver to</p>
                <p className="mt-1 text-sm leading-relaxed text-[#111111]/80">
                  {order.shipping_name}, {order.shipping_address}, {order.shipping_city},{' '}
                  {order.shipping_state} - {order.shipping_pincode}
                </p>
              </div>
            </section>

            {['packed', 'shipped', 'delivered'].includes(String(order.status).toLowerCase()) && (
              <p role="status" className={`${PANEL} text-sm leading-relaxed text-[#111111]/70`}>
                Sorry, this order can no longer be cancelled because it has moved beyond the processing stage.
              </p>
            )}

            {/* Return request: the button, the form and the return status all live here. */}
            <CancelSection orderId={order.id} onChanged={() => load()} />
            <ReturnSection orderId={order.id} isCod={String(order.payment_method).toLowerCase() === 'cod'} onChanged={() => load()} />

            <section className={PANEL}>
              <p className={LABEL}>Items</p>
              <ul className="mt-4 divide-y divide-[#E53935]/15">
                {order.items.map((item) => (
                  <li key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    {item.product_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="h-20 w-16 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-20 w-16 shrink-0 rounded-md bg-[#F7F7F7]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.product_name}</p>
                      <p className="mt-1 text-xs text-[#111111]/55">
                        {item.size} · {item.color} · Qty {item.quantity}
                      </p>
                      {(item.cancelled_quantity ?? 0) > 0 && (
                        <p className="mt-1 text-xs font-semibold text-[#B42318]">
                          {item.cancelled_quantity} cancelled
                        </p>
                      )}
                      {(item.returned_quantity ?? 0) > 0 && (
                        <p className="mt-1 text-xs font-semibold text-[#8A540C]">
                          {item.returned_quantity} in a return
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-sm text-[#E53935]">
                      {formatINR(Number(item.unit_price) * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <section className={PANEL}>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between text-[#111111]/75">
                  <dt>Subtotal</dt>
                  <dd>{formatINR(Number(order.subtotal))}</dd>
                </div>
                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <dt>Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</dt>
                    <dd>−{formatINR(Number(order.discount_amount))}</dd>
                  </div>
                )}
                <div className="flex justify-between text-[#111111]/75">
                  <dt>Shipping</dt>
                  <dd>
                    {Number(order.shipping_amount) === 0
                      ? 'Complimentary'
                      : formatINR(Number(order.shipping_amount))}
                  </dd>
                </div>
                <div className="flex justify-between text-[#111111]/75">
                  <dt>GST</dt>
                  <dd>{formatINR(Number(order.tax_amount))}</dd>
                </div>
                {Number(order.cod_fee) > 0 && (
                  <div className="flex justify-between text-[#111111]/75">
                    <dt>COD handling fee (incl. GST)</dt>
                    <dd>{formatINR(Number(order.cod_fee) + Number(order.cod_fee_tax || 0))}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-[#E53935]/20 pt-3 font-serif text-lg">
                  <dt>Total</dt>
                  <dd className="text-[#E53935]">{formatINR(Number(order.total_amount))}</dd>
                </div>
              </dl>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

// Customer-only page: signed-out visitors are asked to sign in and brought back here.
export default function OrderDetailPage() {
  return (
    <CustomerAuthGate title="Sign in to view your order">
      <OrderDetailPageView />
    </CustomerAuthGate>
  );
}
