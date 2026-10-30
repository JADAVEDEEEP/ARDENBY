'use client';

import Link from 'next/link';
import type { useProfile } from '../../hooks/use-profile';
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, Check, ChevronDown, Loader2, Package, Search, ShieldAlert, X } from 'lucide-react';
import { startRazorpayPayment, syncOrderPayment } from '../../lib/razorpay-checkout';
import { useCartStore } from '../../store/cart-store';
import { EmptyPanel, SectionTitle } from './metal';
import { CUSTOMER_CANCEL_REASONS, NOTE_MAX, validateCancelReason } from '../../lib/cancel-reasons';
import { OrderStatusChip, Thumb, TrackingTimeline, fmtDate, trackIndex, useOrderDetails } from './order-ui';

type ProfileState = ReturnType<typeof useProfile>;
type OrderRow = ProfileState['orders'][number];

const isUnpaidOnline = (order: OrderRow) =>
  String(order.payment_method).toLowerCase() === 'online' &&
  String(order.payment_status).toLowerCase() !== 'paid' &&
  String(order.payment_status).toLowerCase() !== 'partially refunded' &&
  String(order.payment_status).toLowerCase() !== 'refunded' &&
  order.status === 'Processing';

// Must match the backend rule (order.service.js CUSTOMER_CANCELLABLE_STATUSES).
const CANCELLABLE = ['pending', 'confirmed', 'processing'];
const PAST_PROCESSING = ['packed', 'shipped', 'delivered'];
const CANCEL_BLOCKED_NOTE =
  'Sorry, this order can no longer be cancelled because it has moved beyond the processing stage.';
// Refund bookkeeping is internal (admin only); customers just see Cancelled.
const canCancel = (order: OrderRow) => CANCELLABLE.includes(String(order.status).toLowerCase());
const pastProcessing = (order: OrderRow) => PAST_PROCESSING.includes(String(order.status).toLowerCase());

const STATUS_FILTERS = ['All statuses', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'] as const;

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
  const isPaid = ['paid', 'partially refunded'].includes(String(order.payment_status).toLowerCase());

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

  const [reasonCode, setReasonCode] = useState('');
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);
  const reasonProblem = validateCancelReason(reasonCode, note);

  const confirm = async () => {
    setTouched(true);
    if (reasonProblem) return;
    if (await profile.cancelOrder(order.id, { reasonCode, note: note.trim() || undefined })) onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kv-cancel-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4"
    >
      <div className="relative w-full max-w-md rounded-[4px] border border-[#E5E5E5] bg-white p-6 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="Close"
          className="kv-disc absolute right-4 top-4 h-11 w-11 disabled:opacity-40"
        >
          <X className="h-4 w-4" />
        </button>

        <span className="kv-disc mb-4 h-12 w-12">
          <ShieldAlert className="h-5 w-5 text-[#C8211F]" strokeWidth={1.7} />
        </span>
        <h2 id="kv-cancel-title" className="kv-display text-[30px]">
          Cancel this order?
        </h2>
        <p className="mt-3 text-[16px] leading-6 text-[#444444]">
          Order <span className="font-bold text-[#111111]">#{order.order_number}</span> will be cancelled and its items
          released. This cannot be undone.
        </p>

        <div className="mt-5 flex items-start gap-3 rounded-[4px] bg-[#F5F5F5] p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#111111]" strokeWidth={1.7} />
          <p className="text-[15px] leading-6 text-[#444444]">{paymentNote}</p>
        </div>

        <div className="mt-5">
          <label htmlFor="kv-cancel-reason" className="mb-2 block text-[15px] font-bold text-[#111111]">
            Why are you cancelling?
          </label>
          <select
            id="kv-cancel-reason"
            value={reasonCode}
            onChange={(e) => setReasonCode(e.target.value)}
            disabled={busy}
            className="min-h-[48px] w-full rounded-[4px] border border-[#CFCFCF] bg-white px-3 text-[15px] text-[#111111] outline-none focus:border-[#111111]"
          >
            <option value="">Choose a reason…</option>
            {CUSTOMER_CANCEL_REASONS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </select>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={busy}
            rows={2}
            maxLength={NOTE_MAX}
            aria-label="Anything else you would like us to know (optional)"
            placeholder={reasonCode === 'other' ? 'Please explain' : 'Anything else? (optional)'}
            className="mt-3 w-full rounded-[4px] border border-[#CFCFCF] bg-white px-3 py-2 text-[15px] text-[#111111] outline-none focus:border-[#111111]"
          />
          {touched && reasonProblem && (
            <p role="alert" className="mt-2 text-[14px] text-[#C8211F]">
              {reasonProblem}
            </p>
          )}
        </div>

        {profile.error && (
          <div role="alert" className="mt-5 flex items-start gap-3 rounded-[4px] border border-[#C8211F] px-4 py-3 text-[15px] text-[#C8211F]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="leading-5">{profile.error}</span>
          </div>
        )}

        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button type="button" onClick={onClose} disabled={busy} className="kv-btn-ghost">
            Keep order
          </button>
          <button type="button" onClick={() => void confirm()} disabled={busy} className="kv-btn-danger">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? 'Cancelling…' : profile.error ? 'Try again' : 'Cancel order'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function OrdersSection({ profile }: { profile: ProfileState }) {
  const [payingId, setPayingId] = useState<string | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('All statuses');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');

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

  const sortedAll = useMemo(() => {
    const list = [...profile.orders];
    list.sort((a, b) => {
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sort === 'newest' ? diff : -diff;
    });
    return list;
  }, [profile.orders, sort]);

  // Item names and thumbnails come from each order's detail; load the first page plus any opened order.
  const detailIds = useMemo(() => {
    const ids = sortedAll.slice(0, 12).map((o) => o.id);
    if (openId && !ids.includes(openId)) ids.push(openId);
    return ids;
  }, [sortedAll, openId]);
  const details = useOrderDetails(detailIds);

  const visible = sortedAll.filter((o) => {
    if (status !== 'All statuses') {
      const s = String(o.status).toLowerCase();
      const want = status.toLowerCase();
      if (want === 'processing' ? !['processing', 'pending', 'confirmed'].includes(s) : s !== want) return false;
    }
    const q = query.trim().toLowerCase();
    if (!q) return true;
    if (String(o.order_number).toLowerCase().includes(q)) return true;
    return (details[o.id]?.items ?? []).some((it) => it.product_name?.toLowerCase().includes(q));
  });

  const payNow = async (order: OrderRow) => {
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

  const total = profile.orders.length;

  return (
    <section>
      {/* Toast — cancel / payment results are visible here */}
      {!modalOpen && (profile.message || profile.error) && (
        <div className="pointer-events-none fixed right-4 top-24 z-[9999] w-[min(380px,calc(100vw-2rem))] sm:right-6">
          <div
            role={profile.error ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 rounded-[4px] border bg-white px-4 py-3.5 ${
              profile.error ? 'border-[#C8211F]' : 'border-[#111111]'
            }`}
          >
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                profile.error ? 'text-[#C8211F]' : 'text-[#111111]'
              }`}
            >
              {profile.error ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            </span>
            <p className="min-w-0 flex-1 text-[15px] leading-5 text-[#111111]">{profile.error || profile.message}</p>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={dismissToast}
              className="flex h-8 w-8 shrink-0 items-center justify-center text-[#666666] hover:text-[#111111]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {modalOpen && cancelTarget && <CancelOrderModal order={cancelTarget} profile={profile} onClose={closeModal} />}

      <SectionTitle
        title={total ? `My orders · ${total} ${total === 1 ? 'order' : 'orders'}` : 'My orders'}
        sub={total ? undefined : 'Your KOVENIK purchase history.'}
      />

      {total === 0 ? (
        <EmptyPanel
          icon={Package}
          title="No orders yet"
          text="Your wardrobe journey starts here."
          action={
            <button type="button" onClick={() => profile.router.push('/shop')} className="kv-btn-primary">
              Continue shopping <ArrowRight className="h-4 w-4" />
            </button>
          }
        />
      ) : (
        <>
          {/* toolbar */}
          <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px_180px]">
            <label className="relative block">
              <span className="sr-only">Search by order ID or product</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666666]" aria-hidden />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search order ID or product"
                className="kv-input !pl-11"
              />
            </label>
            <label className="relative block">
              <span className="sr-only">Filter by status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as (typeof STATUS_FILTERS)[number])}
                className="kv-input appearance-none !pr-10"
              >
                {STATUS_FILTERS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2" aria-hidden />
            </label>
            <label className="relative block">
              <span className="sr-only">Sort orders</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')}
                className="kv-input appearance-none !pr-10"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2" aria-hidden />
            </label>
          </div>

          {visible.length === 0 ? (
            <div className="kv-metal px-6 py-12 text-center">
              <p className="text-[18px] font-bold text-[#111111]">No orders match your filters</p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setStatus('All statuses');
                }}
                className="kv-btn-ghost mt-4"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {visible.map((order) => {
                const detail = details[order.id];
                const items = detail?.items ?? [];
                const isCod = String(order.payment_method).toLowerCase() === 'cod';
                const open = openId === order.id;
                const tracking = trackIndex(order.status) >= 0;
                const arriving = String(order.status).toLowerCase() === 'delivered' ? `Delivered ${fmtDate(detail?.updated_at) ?? ''}` : null;

                return (
                  <article key={order.id} className="overflow-hidden rounded-[4px] border border-[#E5E5E5] bg-white">
                    {/* header row */}
                    <header className="grid gap-x-6 gap-y-3 border-b border-[#E5E5E5] bg-[#F5F5F5] px-4 py-4 sm:grid-cols-[1.4fr_1fr_0.7fr_1fr_auto] sm:items-center sm:px-6">
                      <div className="min-w-0">
                        <p className="text-[14px] text-[#666666]">Order ID</p>
                        <p className="truncate text-[17px] font-bold text-[#111111]">#{order.order_number}</p>
                      </div>
                      <div>
                        <p className="text-[14px] text-[#666666]">Placed on</p>
                        <p className="text-[16px] font-semibold text-[#111111]">{fmtDate(order.created_at, true)}</p>
                      </div>
                      <div>
                        <p className="text-[14px] text-[#666666]">Items</p>
                        <p className="text-[16px] font-semibold text-[#111111]">
                          {detail ? items.reduce((n, it) => n + Number(it.quantity || 0), 0) : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[14px] text-[#666666]">Total</p>
                        <p className="text-[17px] font-bold tabular-nums text-[#111111]">{profile.money(order.total_amount)}</p>
                      </div>
                      <div className="sm:justify-self-end">
                        <OrderStatusChip status={order.status} />
                      </div>
                    </header>

                    {/* body */}
                    <div className="p-4 sm:p-6">
                      <p className="text-[15px] text-[#666666]">
                        {isCod ? 'Cash on Delivery' : `Online payment · ${order.payment_status}`}
                        {arriving ? ` · ${arriving}` : ''}
                      </p>

                      {items.length > 0 && (
                        <ul className="mt-4 space-y-3">
                          {items.map((it, i) => (
                            <li key={`${order.id}-${i}`} className="flex items-center gap-3">
                              <Thumb src={it.product_image} alt={it.product_name} size={56} />
                              <span className="min-w-0">
                                <span className="block text-[16px] font-bold leading-5 text-[#111111]">{it.product_name}</span>
                                <span className="block text-[15px] text-[#666666]">
                                  {[it.size && `Size ${it.size}`, it.color, `Qty ${it.quantity}`].filter(Boolean).join(' · ')}
                                </span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {pastProcessing(order) && String(order.status).toLowerCase() !== 'delivered' && (
                        <p className="mt-4 text-[15px] leading-6 text-[#666666]">{CANCEL_BLOCKED_NOTE}</p>
                      )}

                      {/* actions */}
                      <div className="mt-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
                        {tracking && (
                          <button
                            type="button"
                            onClick={() => setOpenId(open ? null : order.id)}
                            className="kv-btn-primary"
                            aria-expanded={open}
                          >
                            Track order
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setOpenId(open ? null : order.id)}
                          className="kv-btn-ghost"
                          aria-expanded={open}
                        >
                          {open ? 'Hide details' : 'View details'}
                        </button>
                        {/* Delivered orders: the order page holds the "Request a return" form and the return status. */}
                        {String(order.status).toLowerCase() === 'delivered' && (
                          <Link href={`/orders/${encodeURIComponent(order.id)}`} className="kv-btn-ghost text-center">
                            Return items
                          </Link>
                        )}
                        {isUnpaidOnline(order) && (
                          <button
                            type="button"
                            disabled={payingId === order.id}
                            onClick={() => void payNow(order)}
                            className="kv-btn-primary"
                          >
                            {payingId === order.id ? 'Opening…' : 'Pay now'}
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
                            Cancel order
                          </button>
                        )}
                      </div>

                      {/* expanded view */}
                      {open && (
                        <div className="mt-6 border-t border-[#E5E5E5] pt-6">
                          {tracking && (
                            <div className="mb-8">
                              <h3 className="kv-display mb-4 text-[22px]">Tracking</h3>
                              <TrackingTimeline order={detail ?? order} />
                            </div>
                          )}

                          {!detail ? (
                            <p className="flex items-center gap-2 text-[15px] text-[#666666]">
                              <Loader2 className="h-4 w-4 animate-spin" /> Loading details…
                            </p>
                          ) : (
                            <div className="grid gap-6 md:grid-cols-3">
                              <div>
                                <h3 className="kv-display mb-2 text-[20px]">Delivery address</h3>
                                <p className="text-[16px] leading-6 text-[#444444]">
                                  <span className="font-bold text-[#111111]">{detail.shipping_name}</span>
                                  <br />
                                  {detail.shipping_address}
                                  <br />
                                  {[detail.shipping_city, detail.shipping_state].filter(Boolean).join(', ')} {detail.shipping_pincode}
                                </p>
                              </div>
                              <div>
                                <h3 className="kv-display mb-2 text-[20px]">Payment</h3>
                                <dl className="space-y-1.5 text-[16px]">
                                  <div className="flex justify-between gap-3">
                                    <dt className="text-[#666666]">Method</dt>
                                    <dd className="font-semibold text-[#111111]">{isCod ? 'Cash on Delivery' : 'Online (Razorpay)'}</dd>
                                  </div>
                                  <div className="flex justify-between gap-3">
                                    <dt className="text-[#666666]">Status</dt>
                                    <dd className="font-semibold text-[#111111]">
                                      {String(order.status).toLowerCase() === 'cancelled' ? 'Cancelled' : order.payment_status}
                                    </dd>
                                  </div>
                                </dl>
                              </div>
                              <div>
                                <h3 className="kv-display mb-2 text-[20px]">Price details</h3>
                                <dl className="space-y-1.5 text-[16px]">
                                  <div className="flex justify-between gap-3">
                                    <dt className="text-[#666666]">Subtotal</dt>
                                    <dd className="tabular-nums">{profile.money(Number(detail.subtotal))}</dd>
                                  </div>
                                  {Number(detail.discount_amount) > 0 && (
                                    <div className="flex justify-between gap-3">
                                      <dt className="text-[#666666]">Discount</dt>
                                      <dd className="tabular-nums text-[#C8211F]">−{profile.money(Number(detail.discount_amount))}</dd>
                                    </div>
                                  )}
                                  <div className="flex justify-between gap-3">
                                    <dt className="text-[#666666]">Shipping</dt>
                                    <dd className="tabular-nums">
                                      {Number(detail.shipping_amount) === 0 ? 'FREE' : profile.money(Number(detail.shipping_amount))}
                                    </dd>
                                  </div>
                                  <div className="flex justify-between gap-3">
                                    <dt className="text-[#666666]">GST (5%)</dt>
                                    <dd className="tabular-nums">{profile.money(Number(detail.tax_amount))}</dd>
                                  </div>
                                  <div className="flex justify-between gap-3 border-t border-[#E5E5E5] pt-2 text-[17px] font-bold">
                                    <dt>Total</dt>
                                    <dd className="tabular-nums">{profile.money(Number(detail.total_amount))}</dd>
                                  </div>
                                </dl>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
