'use client';

import type { useProfile } from '../../hooks/use-profile';
import { Ticket, Sparkles } from 'lucide-react';
import { Panel } from './ui';

type ProfileState = ReturnType<typeof useProfile>;

export function CouponsSection({
  profile,
}: {
  profile: ProfileState;
}) {
  const coupons = profile?.coupons ?? [];

  return (
    <Panel
      title="Offers"
      subtitle="Exclusive promotions and KOVENIK benefits."
    >
      {coupons.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {coupons.map((coupon: any) => (
            <div
              key={coupon.id}
              className="relative overflow-hidden rounded-2xl border border-[#B99A5B]/35 bg-[#090909] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
            >
              <div className="pointer-events-none absolute -left-16 -top-16 h-36 w-36 rounded-full bg-[#C8A96B]/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -right-16 h-36 w-36 rounded-full bg-[#C8A96B]/10 blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#C5A45D]/50 bg-[#111111]">
                  <Ticket className="h-6 w-6 text-[#D8BD7A]" strokeWidth={1.2} />
                </div>

                <div className="rounded-full border border-[#B99A5B]/30 bg-[#111111] px-3 py-1">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C8A96B]">
                    Active
                  </span>
                </div>
              </div>

              <div className="relative mt-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#B99A5B]">
                  Coupon Code
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <h3 className="font-mono text-xl font-bold tracking-[0.12em] text-[#F3E8D0]">
                    {coupon.code}
                  </h3>
                  <Sparkles
                    className="h-4 w-4 text-[#E3CA8A]"
                    strokeWidth={1.5}
                  />
                </div>

                {coupon.description && (
                  <p className="mt-3 text-sm leading-6 text-[#BDB3A3]">
                    {coupon.description}
                  </p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[#B99A5B]/20 bg-[#111111] p-3">
                    <p className="text-[9px] uppercase tracking-[0.16em] text-[#8E877C]">
                      Discount
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#E3CA8A]">
                      {coupon.discount_type === 'percentage'
                        ? `${coupon.discount_value}% OFF`
                        : `₹${Number(coupon.discount_value || 0).toLocaleString('en-IN')} OFF`}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#B99A5B]/20 bg-[#111111] p-3">
                    <p className="text-[9px] uppercase tracking-[0.16em] text-[#8E877C]">
                      Min. Order
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#F3E8D0]">
                      ₹{Number(coupon.min_order || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {coupon.max_discount !== null &&
                  coupon.max_discount !== undefined && (
                    <p className="mt-3 text-xs text-[#8E877C]">
                      Maximum discount: ₹
                      {Number(coupon.max_discount).toLocaleString('en-IN')}
                    </p>
                  )}

                {coupon.expiry && (
                  <p className="mt-2 text-xs text-[#8E877C]">
                    Valid until:{' '}
                    {new Date(coupon.expiry).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-[#B99A5B]/35 bg-[#090909] px-6 py-14 text-center shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:px-10">
          <div className="pointer-events-none absolute -left-20 -top-20 h-48 w-48 rounded-full bg-[#C8A96B]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-[#C8A96B]/10 blur-3xl" />

          <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
            <div className="absolute left-0 top-1/3 h-px w-full bg-[#D8BD7A]" />
            <div className="absolute left-0 top-2/3 h-px w-full bg-[#D8BD7A]" />
          </div>

          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#C5A45D]/50 bg-[#111111] shadow-[0_0_30px_rgba(197,164,93,0.12)]">
            <Ticket className="h-7 w-7 text-[#D8BD7A]" strokeWidth={1.2} />
            <Sparkles
              className="absolute -right-1 -top-1 h-4 w-4 text-[#E3CA8A]"
              strokeWidth={1.5}
            />
          </div>

          <div className="relative mt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#B99A5B]">
              KOVENIK PRIVILEGES
            </p>

            <h3 className="mt-3 font-serif text-2xl font-medium tracking-wide text-[#F3E8D0] sm:text-3xl">
              Your offers
            </h3>

            <p className="mx-auto mt-3 max-w-md text-xs leading-6 text-[#9E968A]">
              No active offers are available for your account right now.
              Available coupon codes can be entered from the cart.
            </p>
          </div>

          <div className="relative mx-auto mt-7 flex items-center justify-center gap-3">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-[#B99A5B]/60" />
            <span className="h-1.5 w-1.5 rotate-45 border border-[#D8BD7A] bg-[#111111]" />
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-[#B99A5B]/60" />
          </div>

          <div className="relative mx-auto mt-7 inline-flex items-center gap-2 rounded-full border border-[#B99A5B]/25 bg-[#111111] px-4 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C8A96B] shadow-[0_0_8px_rgba(200,169,107,0.8)]" />
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#BDB3A3]">
              No active offers
            </span>
          </div>
        </div>
      )}
    </Panel>
  );
}
