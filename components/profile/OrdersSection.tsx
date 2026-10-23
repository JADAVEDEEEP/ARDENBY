'use client';

import type { useProfile } from '../../hooks/use-profile';
import { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, Check, Loader2, Package, ShieldAlert, X } from 'lucide-react';
import { startRazorpayPayment, syncOrderPayment } from '../../lib/razorpay-checkout';
import { useCartStore } from '../../store/cart-store';
import { EmptyPanel, SectionTitle } from './metal';

type ProfileState = ReturnType<typeof useProfile>;

function statusClasses(status: string) {
  const s = String(status).toLowerCase();
  if (s === 'delivered') return 'border-[#245a3a] bg-[#11261a] text-[#5FD08A]';
  if (s === 'cancelled' || s === 'canceled') return 'border-[#5a2a2c] bg-[#2a1517] text-[#EF7B7B]';
  if (s === 'shipped') return 'border-[#2c4670] bg-[#14223a] text-[#9FC3FF]';
  return 'border-[#5a4a2a] bg-[#261f12] text-[#D6B06A]';
}

const isUnpaidOnline = (order: ProfileState['orders'][number]) =>
  String(order.payment_method).toLowerCase() === 'online' &&
  String(order.payment_status).toLowerCase() !== 'paid' &&
  String(order.payment_status).toLowerCase() !== 'refunded' &&
  order.status === 'Processing';

type OrderRow = ProfileState['orders'][number];

// Must match the backend rule (order.service.js CUSTOMER_CANCELLABLE_STATUSES).
const CANCELLABLE = ['pending', 'confirmed', 'processing'];
const PAST_PROCESSING = ['packed', 'shipped', 'delivered'];
const CANCEL_BLOCKED_NOTE =
  'Sorry, this order can no longer be cancelled because it has moved beyond the processing stage.';
// Refund bookkeeping is internal (admin only); customers just see Cancelled.
const canCancel = (order: OrderRow) => CANCELLABLE.includes(String(order.status).toLowerCase());
const pastProcessing = (order: OrderRow) =>
  PAST_PROCESSING.includes(String(order.status).toLowerCase());
function CancelOrderModal({
  order,
  profile,
  onClose,
}: {
  order: OrderRow;
  profile: ProfileState;
  onClose: () => void;
}) {
  const busy = profile.cancellingId === order.id;
  const isOnline = String(order.payment_method).toLowerCase() === 'online';
  const isPaid = String(order.payment_status).toLowerCase() === 'paid';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  // Only says what is true: a payment was taken, and it goes back to the original method.
  const paymentNote =
    isOnline && isPaid
      ? `Your payment of ${profile.money(order.total_amount)} will be returned to your original payment method.`
      : isOnline
        ? 'No payment has been received for this order, so there is nothing to refund.'
        : 'This is a Cash on Delivery order, so no payment was taken and nothing needs to be refunded.';

  const confirm = async () => {
    if (await profile.cancelOrder(order.id)) onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kv-cancel-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md"
    >
      <div className="kv-metal w-full max-w-md">
        <div className="p-6 sm:p-8">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="kv-disc absolute right-4 top-4 h-11 w-11 disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>

          <span className="kv-disc mb-5 h-12 w-12">
            <ShieldAlert className="h-5 w-5 text-[#EF7B7B]" strokeWidth={1.7} />
          </span>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#EF7B7B]">
            KOVENIK — Cancel order
          </p>
          <h2
            id="kv-cancel-title"
            className="mt-3 text-[28px] font-normal leading-tight text-white"
            style={{ fontFamily: 'Bodoni MT, Didot, serif' }}
          >
            Cancel this order?
          </h2>
          <p className="mt-3 text-[13px] leading-6 text-[#C6C9CF]">
            Order <span className="font-semibold text-white">#{order.order_number}</span> will be
            cancelled and its items released. This cannot be undone.
          </p>

          <div className="kv-inner mt-5 flex items-start gap-3 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#D6B06A]" strokeWidth={1.7} />
            <p className="text-[12px] leading-5 text-[#C6C9CF]">{paymentNote}</p>
          </div>

          {profile.error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-xl border border-[#5a2a2c] bg-[#2a1517] px-4 py-3 text-[12px] text-[#EF7B7B]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="leading-5">{profile.error}</span>
            </div>
          )}

          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button type="button" onClick={onClose} disabled={busy} className="kv-btn-ghost">
              Keep Order
            </button>
            <button type="button" onClick={() => void confirm()} disabled={busy} className="kv-btn-danger">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ? 'Cancelling…' : profile.error ? 'Try Again' : 'Cancel Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrdersSection({ profile }: { profile: ProfileState }) {
  const [payingId, setPayingId] = useState<string | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  // Derived, so the modal closes by itself once the refreshed list shows the
  // order is no longer cancellable (cancelled, or moved past Processing).
  const cancelTarget = profile.orders.find((o) => o.id === cancelTargetId);
  const modalOpen = Boolean(cancelTarget && canCancel(cancelTarget));

  const closeModal = () => {
    if (profile.cancellingId) return;
    setCancelTargetId(null);
    profile.setError('');
  };

  const dismissToast = () => {
    profile.setError('');
    profile.setMessage('');
  };

  const payNow = async (order: ProfileState['orders'][number]) => {
    if (payingId) return;
    setPayingId(order.id);
    profile.setError('');
    profile.setMessage('');

    try {
      // The customer may have paid and closed the tab; check with Razorpay first.
      if (await syncOrderPayment(order.id).catch(() => false)) {
        profile.setMessage(`Payment received for ${order.order_number}.`);
      } else {
        const result = await startRazorpayPayment(order.id, {
          name: profile.user?.full_name,
          contact: profile.user?.phone ?? undefined,
          email: profile.user?.email,
        });

        if (result.status === 'paid') {
          profile.setMessage(`Payment successful for ${result.orderNumber}.`);
        } else if (result.status === 'failed') {
          profile.setError(result.message);
        }
      }
    } catch (err: any) {
      profile.setError(err?.message || 'Unable to start payment.');
    } finally {
      setPayingId(null);
      await profile.loadSection('orders');
      // Payment empties the server cart; refresh the local copy.
      void useCartStore.getState().loadUserCart();
    }
  };

  return (
    <section>
      {/* Toast — same pattern as the Addresses tab, so cancel results are visible here */}
      {!modalOpen && (profile.message || profile.error) && (
        <div className="pointer-events-none fixed right-4 top-24 z-[9999] w-[min(380px,calc(100vw-2rem))] sm:right-6">
          <div
            role={profile.error ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border bg-[#1C1E22] px-4 py-3.5 shadow-[0_18px_55px_rgba(0,0,0,0.6)] ${
              profile.error ? 'border-[#6a2f31]' : 'border-[#42454C]'
            }`}
          >
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                profile.error ? 'bg-[#2a1517] text-[#EF7B7B]' : 'bg-[#11261a] text-[#5FD08A]'
              }`}
            >
              {profile.error ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            </span>
            <p className="min-w-0 flex-1 text-[13px] leading-5 text-white">{profile.error || profile.message}</p>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={dismissToast}
              className="flex h-8 w-8 shrink-0 items-center justify-center text-[#9296A0] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {modalOpen && cancelTarget && (
        <CancelOrderModal order={cancelTarget} profile={profile} onClose={closeModal} />
      )}

      <SectionTitle
        label="KOVENIK — ORDERS"
        title="My Orders"
        sub={
          profile.orders.length
            ? `${profile.orders.length} ${profile.orders.length === 1 ? 'order' : 'orders'} in your purchase history.`
            : 'Your KOVENIK purchase history.'
        }
      />

      {profile.orders.length === 0 ? (
        <EmptyPanel
          icon={Package}
          title="No orders yet"
          text="Your wardrobe journey starts here."
          action={
            <button type="button" onClick={() => profile.router.push('/shop')} className="kv-btn-primary">
              Continue Shopping <ArrowRight className="h-4 w-4" />
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {profile.orders.map((order) => {
            const items: { name?: string; product_name?: string; size?: string; color?: string; quantity?: number }[] =
              Array.isArray((order as any).items) ? (order as any).items : [];
            const isCod = String(order.payment_method).toLowerCase() === 'cod';
            return (
              <article
                key={order.id}
                className="rounded-2xl border border-white/10 bg-[#0c0c0d] p-4 transition-colors hover:border-white/20 sm:p-6"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${statusClasses(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-3 truncate text-[15px] font-medium text-white">#{order.order_number}</p>
                    <p className="mt-1 text-[12px] font-medium text-[#8a8d94]">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {' · '}
                      {isCod
                        ? 'Cash on delivery'
                        : String(order.status).toLowerCase() === 'cancelled'
                          ? 'Online payment'
                          : `Online · ${order.payment_status}`}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 md:justify-end md:gap-6">
                    <p className="text-[20px] font-medium tabular-nums text-white">{profile.money(order.total_amount)}</p>
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => profile.router.push(`/orders/${order.id}`)}
                        className="inline-flex min-h-[40px] items-center rounded-full border border-white/20 bg-transparent px-5 text-[12px] font-medium tracking-wide text-white transition-colors hover:border-white/50 hover:bg-white/5"
                      >
                        View Order
                      </button>

                      {isUnpaidOnline(order) && (
                        <button
                          type="button"
                          disabled={payingId === order.id}
                          onClick={() => void payNow(order)}
                          className="kv-btn-primary"
                        >
                          {payingId === order.id ? 'Opening…' : 'Pay Now'}
                        </button>
                      )}

                      {canCancel(order) && (
                        <button
                          type="button"
                          disabled={Boolean(profile.cancellingId)}
                          onClick={() => {
                            profile.setError('');
                            profile.setMessage('');
                            setCancelTargetId(order.id);
                          }}
                          className="kv-btn-danger"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {items.length > 0 && (
                  <ul className="mt-4 space-y-1 border-t border-white/10 pt-4 text-[12px] text-[#C6C9CF]">
                    {items.map((it, i) => (
                      <li key={i} className="truncate">
                        {it.name || it.product_name}
                        {(it.size || it.color) && (
                          <span className="text-[#8a8d94]"> · {[it.size, it.color].filter(Boolean).join(' / ')}</span>
                        )}
                        {it.quantity ? <span className="text-[#8a8d94]"> × {it.quantity}</span> : null}
                      </li>
                    ))}
                  </ul>
                )}

                {pastProcessing(order) && (
                  <p className="mt-4 border-t border-white/10 pt-4 text-[12px] leading-5 text-[#8a8d94]">
                    {CANCEL_BLOCKED_NOTE}
                  </p>
                )}

              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
