'use client';

import type { useProfile } from '../../hooks/use-profile';
import { Package, ArrowRight } from 'lucide-react';

type ProfileState = ReturnType<typeof useProfile>;

/* KOVENIK: surfaces #0A0A0A/#101010/#141414 · ivory #F3EBDD · gold #C9A24B · champagne #E6CF92 */
const GOLD_SURFACE =
  'bg-[linear-gradient(135deg,#9C7A32_0%,#E6CF92_45%,#B8903A_100%)] text-[#0A0A0A]';

/* Presentation only: subtle tint per status, gold fallback for anything else */
function statusClasses(status: string) {
  const s = String(status).toLowerCase();
  if (s === 'delivered') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
  if (s === 'cancelled' || s === 'canceled') return 'border-red-500/40 bg-red-500/10 text-red-300';
  return 'border-[#C9A24B]/50 bg-[#C9A24B]/10 text-[#E6CF92]';
}

export function OrdersSection({ profile }: { profile: ProfileState }) {
  return (
    <section>
      <p className="mb-5 text-[13px] text-[#F3EBDD]/60">Your KOVENIK purchase history.</p>

      {profile.orders.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-[1px] border-dashed border-[#C9A24B]/30 bg-[#0A0A0A] px-6 py-14 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border-[1px] border-[#C9A24B]/60 shadow-[0_0_20px_rgba(201,162,75,0.12)]">
            <Package className="h-7 w-7 text-[#C9A24B]" strokeWidth={1.4} />
          </div>
          <h3 className="font-serif text-2xl text-[#F3EBDD]">No orders yet</h3>
          <p className="mt-2 max-w-xs text-[13px] text-[#F3EBDD]/55">
            Your wardrobe journey starts here.
          </p>
          <button
            type="button"
            onClick={() => profile.router.push('/')}
            className={`mt-7 inline-flex min-h-[48px] items-center gap-2 rounded-lg px-7 text-[11px] font-bold uppercase tracking-[0.16em] shadow-[0_0_20px_rgba(201,162,75,0.22)] transition hover:brightness-110 ${GOLD_SURFACE}`}
          >
            Continue Shopping
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {profile.orders.map((order) => (
            <div
              key={order.id}
              className="group rounded-2xl border-[1px] border-[#C9A24B]/20 bg-[linear-gradient(180deg,#141414_0%,#0A0A0A_100%)] p-4 shadow-[inset_0_1px_0_rgba(230,207,146,0.06)] transition-colors duration-300 hover:border-[#C9A24B]/50 sm:p-5"
            >
              <div className="grid gap-4 md:grid-cols-[1.4fr_0.8fr_0.8fr_auto] md:items-center">
                {/* Order */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A24B]">
                    Order
                  </p>
                  <p className="mt-1 text-[15px] font-medium text-[#F3EBDD]">{order.order_number}</p>
                  <p className="mt-1 text-[11px] text-[#F3EBDD]/50">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                {/* Status + Total share a row on mobile */}
                <div className="grid grid-cols-2 gap-4 md:contents">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A24B]">
                      Status
                    </p>
                    <span
                      className={`mt-1.5 inline-block rounded-full border-[1px] px-3 py-1 text-[11px] font-medium ${statusClasses(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A24B]">
                      Total
                    </p>
                    <p className="mt-1 text-lg font-bold tracking-tight text-[#E6CF92]">
                      {profile.money(order.total_amount)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <button
                    type="button"
                    onClick={() => profile.router.push(`/profile.orders/${order.id}`)}
                    className="min-h-[44px] rounded-lg border-[1px] border-[#C9A24B]/60 px-5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#F3EBDD] transition-colors hover:border-[#E6CF92] hover:text-[#E6CF92]"
                  >
                    View Order
                  </button>

                  {['Confirmed', 'Processing', 'Packed'].includes(order.status) && (
                    <button
                      type="button"
                      onClick={() => profile.cancelOrder(order.id)}
                      className="min-h-[44px] rounded-lg border-[1px] border-red-400/30 px-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-red-300/80 transition-colors hover:border-red-400/60 hover:text-red-300"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}