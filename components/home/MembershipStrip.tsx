'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { formatINR } from '@/lib/format';
import { fetchMembershipPlans, type MembershipPlan } from '@/lib/membership-api';

/**
 * Homepage membership banner. Every number comes from the live plans, so changing a
 * price or discount in the admin panel updates this immediately. Shows nothing until
 * plans load (or if there are none), never placeholder figures.
 */
export function MembershipStrip() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetchMembershipPlans(controller.signal)
      .then(setPlans)
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  if (plans.length === 0) return null;

  const cheapest = Math.min(...plans.map((p) => p.price));
  const bestDiscount = Math.max(...plans.map((p) => p.discountPercent));

  return (
    <section aria-label="KÖVENIK membership" className="bg-[#111111] text-white">
      <div className="mx-auto flex max-w-[1280px] flex-col items-start gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#FF8A87]">KÖVENIK Membership</p>
          <h2 className="mt-1 text-[22px] font-bold leading-tight md:text-[28px]">
            {bestDiscount > 0 ? `Save up to ${bestDiscount}% every day.` : 'Join the club.'} Plans from {formatINR(cheapest)} a year.
          </h2>
          <p className="mt-1 text-[14px] text-white/70">Member prices, early access to new drops and priority support.</p>
        </div>
        <Link
          href="/membership"
          className="inline-flex min-h-[48px] shrink-0 items-center rounded-[3px] bg-[#E53935] px-7 text-[13px] font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#C62E2B]"
        >
          Explore membership
        </Link>
      </div>
    </section>
  );
}
