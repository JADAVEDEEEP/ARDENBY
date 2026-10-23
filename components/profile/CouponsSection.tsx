'use client';

import { useState } from 'react';
import type { useProfile } from '../../hooks/use-profile';
import { Ticket, Copy, Check } from 'lucide-react';
import { EmptyPanel, SectionTitle } from './metal';

type ProfileState = ReturnType<typeof useProfile>;

const fmtDate = (raw?: string) => {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export function CouponsSection({ profile }: { profile: ProfileState }) {
  const coupons = (profile?.coupons ?? []) as any[];
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = async (coupon: any) => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopiedId(coupon.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      profile.setError('Unable to copy the code. Please copy it manually.');
    }
  };

  return (
    <section>
      <SectionTitle
        label="KOVENIK — PRIVILEGES"
        title="Coupons & Offers"
        sub={coupons.length ? `${coupons.length} active ${coupons.length === 1 ? 'offer' : 'offers'}` : 'Exclusive promotions and KOVENIK benefits.'}
      />

      {coupons.length === 0 ? (
        <EmptyPanel
          icon={Ticket}
          title="No active offers"
          text="No offers are available for your account right now. Coupon codes can be entered from the cart."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {coupons.map((coupon) => {
            const discount =
              coupon.discount_type === 'percentage'
                ? `${Number(coupon.discount_value)}%`
                : `₹${Number(coupon.discount_value || 0).toLocaleString('en-IN')}`;
            const expiry = fmtDate(coupon.expiry);
            const copied = copiedId === coupon.id;

            return (
              <div key={coupon.id} className="kv-inner flex min-w-0 overflow-hidden">
                <div className="min-w-0 flex-1 p-5">
                  <p className="kv-label">Your offer</p>
                  <p className="mt-2 text-[34px] font-light leading-none text-white">
                    {discount} <span className="text-[16px] text-[#C6C9CF]">OFF</span>
                  </p>
                  {coupon.description && <p className="mt-3 break-words text-[13px] leading-5 text-[#C6C9CF]">{coupon.description}</p>}
                  <ul className="mt-3 space-y-0.5 text-[12px] text-[#9296A0]">
                    {Number(coupon.min_order) > 0 && <li>On orders above ₹{Number(coupon.min_order).toLocaleString('en-IN')}</li>}
                    {coupon.max_discount !== null && coupon.max_discount !== undefined && Number(coupon.max_discount) > 0 && (
                      <li>Maximum discount ₹{Number(coupon.max_discount).toLocaleString('en-IN')}</li>
                    )}
                    {expiry && <li>Valid till {expiry}</li>}
                  </ul>
                </div>

                <div className="flex w-[124px] shrink-0 flex-col items-center justify-center gap-3 border-l border-dashed border-[#4a4d55] p-3">
                  <span className="break-all text-center text-[12px] font-bold tracking-[0.12em] text-[#D6B06A]">{coupon.code}</span>
                  <button type="button" onClick={() => copy(coupon)} className="kv-btn-primary !px-4">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
