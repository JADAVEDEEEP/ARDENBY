'use client';

import { useMemo, useState } from 'react';
import type { useProfile } from '../../hooks/use-profile';
import { Ticket, Copy, Check } from 'lucide-react';
import { EmptyPanel, SectionTitle } from './metal';

type ProfileState = ReturnType<typeof useProfile>;
type Tab = 'available' | 'used' | 'expired';

const fmtDate = (raw?: string) => {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const rupees = (n: unknown) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export function CouponsSection({ profile }: { profile: ProfileState }) {
  const coupons = useMemo(() => (profile?.coupons ?? []) as any[], [profile?.coupons]);
  const [tab, setTab] = useState<Tab>('available');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Only what the API tells us: expired = past its expiry date or switched off.
  // The API does not report redemptions, so "Used" stays empty rather than guessing.
  const groups = useMemo(() => {
    const now = Date.now();
    const isExpired = (c: any) => {
      const t = c.expiry ? new Date(c.expiry).getTime() : NaN;
      return c.active === false || (!Number.isNaN(t) && t < now);
    };
    return {
      available: coupons.filter((c) => !isExpired(c)),
      used: [] as any[],
      expired: coupons.filter(isExpired),
    };
  }, [coupons]);

  const copy = async (coupon: any) => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopiedId(coupon.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      profile.setError('Unable to copy the code. Please copy it manually.');
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'available', label: `Available (${groups.available.length})` },
    { id: 'used', label: `Used (${groups.used.length})` },
    { id: 'expired', label: 'Expired' },
  ];

  const list = groups[tab];

  return (
    <section>
      <SectionTitle title="Coupons & offers" sub="Copy a code and apply it at checkout." />

      <div role="tablist" aria-label="Coupon status" className="mb-6 flex gap-1 border-b border-[#E5E5E5]">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`-mb-px min-h-[48px] border-b-[3px] px-4 text-[16px] ${
                active ? 'border-[#EF3535] font-bold text-[#111111]' : 'border-transparent font-medium text-[#666666]'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <EmptyPanel
          icon={Ticket}
          title={tab === 'available' ? 'No active offers' : tab === 'used' ? 'No used coupons' : 'No expired coupons'}
          text={
            tab === 'available'
              ? 'No offers are available for your account right now. Coupon codes can also be entered at checkout.'
              : tab === 'used'
                ? 'Coupons you redeem will show up here.'
                : 'Expired coupons will show up here.'
          }
        />
      ) : (
        <div className="space-y-5">
          {list.map((coupon) => {
            const off = tab === 'expired';
            const discount =
              coupon.discount_type === 'percentage' ? `${Number(coupon.discount_value)}%` : rupees(coupon.discount_value);
            const expiry = fmtDate(coupon.expiry);
            const copied = copiedId === coupon.id;
            const tiles = [
              Number(coupon.min_order) > 0 && { label: 'Minimum order', value: rupees(coupon.min_order) },
              coupon.max_discount != null && Number(coupon.max_discount) > 0 && {
                label: 'Maximum discount',
                value: rupees(coupon.max_discount),
              },
              expiry && { label: off ? 'Ended' : 'Valid till', value: expiry },
            ].filter(Boolean) as { label: string; value: string }[];

            return (
              <article
                key={coupon.id}
                className={`grid overflow-hidden rounded-[4px] border md:grid-cols-[minmax(0,1fr)_260px] ${
                  off ? 'border-[#E5E5E5] bg-[#F5F5F5]' : 'border-[#111111] bg-white'
                }`}
              >
                <div className="min-w-0 p-5 sm:p-6">
                  <span
                    className={`inline-block rounded-[2px] px-2.5 py-1 text-[14px] font-semibold ${
                      off ? 'border border-[#BDBDBD] text-[#666666]' : 'bg-[#111111] text-white'
                    }`}
                  >
                    {off ? 'Expired' : 'Available'}
                  </span>
                  <p className={`kv-display mt-3 text-[44px] leading-none sm:text-[56px] ${off ? '!text-[#666666]' : '!text-[#C8211F]'}`}>
                    {discount} off
                  </p>
                  <p className={`mt-2 break-words text-[17px] font-semibold ${off ? 'text-[#666666]' : 'text-[#111111]'}`}>
                    {coupon.description ||
                      (Number(coupon.min_order) > 0
                        ? `${discount} off on orders above ${rupees(coupon.min_order)}`
                        : `${discount} off your order`)}
                  </p>

                  {tiles.length > 0 && (
                    <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {tiles.map((t) => (
                        <div key={t.label} className="rounded-[2px] border border-[#E5E5E5] bg-[#F5F5F5] px-3 py-2.5">
                          <dt className="text-[14px] text-[#666666]">{t.label}</dt>
                          <dd className="text-[17px] font-bold text-[#111111]">{t.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>

                <div
                  className={`flex flex-col justify-center gap-3 border-t-2 border-dashed p-5 md:border-l-2 md:border-t-0 ${
                    off ? 'border-[#BDBDBD]' : 'border-[#111111]'
                  }`}
                >
                  {off ? (
                    <span className="break-all text-center text-[20px] font-bold tracking-[0.08em] text-[#666666] line-through">
                      {coupon.code}
                    </span>
                  ) : (
                    <>
                      <div className="flex flex-row items-center gap-3 md:flex-col md:items-stretch">
                        <span className="min-w-0 flex-1 break-all rounded-[2px] border-2 border-dashed border-[#111111] px-3 py-3 text-center text-[18px] font-bold tracking-[0.08em] text-[#111111]">
                          {coupon.code}
                        </span>
                        <button type="button" onClick={() => copy(coupon)} className="kv-btn-primary shrink-0">
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          {copied ? 'Copied' : 'Copy code'}
                        </button>
                      </div>
                      <p aria-live="polite" className="text-[15px] leading-5 text-[#666666]">
                        {copied
                          ? '✓ Copied — apply it at checkout'
                          : 'Copying doesn’t apply the code — paste it in the promo field at checkout.'}
                      </p>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
