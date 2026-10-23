'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Package } from 'lucide-react';
import { apiUrl } from '@/lib/api-url';
import { formatINR } from '@/lib/format';
import { CustomerAuthGate } from '@/components/auth/customer-auth-gate';

type OrderItem = {
  id: string;
  product_name: string;
  product_image?: string | null;
  size: string;
  color: string;
  quantity: number;
  unit_price: number | string;
  unit_mrp: number | string;
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
  'rounded-2xl border border-[#C9A24B]/20 bg-[linear-gradient(180deg,#141414_0%,#0A0A0A_100%)] p-5 sm:p-6';
const LABEL = 'text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A24B]';

function OrderDetailPageView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ardenby_token');

    if (!token) {
      router.replace('/profile');
      return;
    }

    let cancelled = false;

    (async () => {
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

        if (!cancelled) setOrder(data.order);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load this order.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  return (
    <main className="min-h-screen bg-[#050505] px-4 pb-16 pt-8 text-[#F3EBDD] sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.15em] text-[#F3EBDD]/70 transition-colors hover:text-[#E6CF92]"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-[#C9A24B]" />
          BACK TO ACCOUNT
        </Link>

        {loading && (
          <div className="flex justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-[#C9A24B]" />
          </div>
        )}

        {!loading && error && (
          <div className={`${PANEL} mt-8 text-center`}>
            <Package className="mx-auto h-8 w-8 text-[#C9A24B]" strokeWidth={1.4} />
            <p className="mt-3 text-sm text-[#F3EBDD]/70">{error}</p>
          </div>
        )}

        {order && (
          <div className="mt-6 space-y-5">
            <header>
              <p className={LABEL}>Order</p>
              <h1 className="mt-1 font-serif text-3xl sm:text-4xl">{order.order_number}</h1>
              <p className="mt-1 text-xs text-[#F3EBDD]/55">
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
                <p className="mt-1 text-sm leading-relaxed text-[#F3EBDD]/80">
                  {order.shipping_name}, {order.shipping_address}, {order.shipping_city},{' '}
                  {order.shipping_state} - {order.shipping_pincode}
                </p>
              </div>
            </section>

            {['packed', 'shipped', 'delivered'].includes(String(order.status).toLowerCase()) && (
              <p role="status" className={`${PANEL} text-sm leading-relaxed text-[#F3EBDD]/70`}>
                Sorry, this order can no longer be cancelled because it has moved beyond the processing stage.
              </p>
            )}

            <section className={PANEL}>
              <p className={LABEL}>Items</p>
              <ul className="mt-4 divide-y divide-[#C9A24B]/15">
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
                      <div className="h-20 w-16 shrink-0 rounded-md bg-[#141414]" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.product_name}</p>
                      <p className="mt-1 text-xs text-[#F3EBDD]/55">
                        {item.size} · {item.color} · Qty {item.quantity}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm text-[#E6CF92]">
                      {formatINR(Number(item.unit_price) * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <section className={PANEL}>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between text-[#F3EBDD]/75">
                  <dt>Subtotal</dt>
                  <dd>{formatINR(Number(order.subtotal))}</dd>
                </div>
                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <dt>Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</dt>
                    <dd>−{formatINR(Number(order.discount_amount))}</dd>
                  </div>
                )}
                <div className="flex justify-between text-[#F3EBDD]/75">
                  <dt>Shipping</dt>
                  <dd>
                    {Number(order.shipping_amount) === 0
                      ? 'Complimentary'
                      : formatINR(Number(order.shipping_amount))}
                  </dd>
                </div>
                <div className="flex justify-between text-[#F3EBDD]/75">
                  <dt>GST</dt>
                  <dd>{formatINR(Number(order.tax_amount))}</dd>
                </div>
                <div className="flex justify-between border-t border-[#C9A24B]/20 pt-3 font-serif text-lg">
                  <dt>Total</dt>
                  <dd className="text-[#E6CF92]">{formatINR(Number(order.total_amount))}</dd>
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
