'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';

import { formatINR } from '@/lib/format';
import { fetchMembershipPlans, type MembershipPlan } from '@/lib/membership-api';

/**
 * Black membership banner. Figures come from the live member plan (nothing is shown until it loads).
 * The newsletter is its own section below (see Newsletter.tsx).
 */
export function MembershipBanner() {
  const [plan, setPlan] = useState<MembershipPlan | undefined>();

  useEffect(() => {
    const controller = new AbortController();
    fetchMembershipPlans(controller.signal)
      .then((plans) => setPlan(plans[0]))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  return (
    <section aria-labelledby="home-join" className="on-dark w-full bg-kv-ink text-white">
      <div className="mx-auto grid w-full max-w-[1280px] items-center gap-8 px-4 py-10 md:grid-cols-[1.2fr_1fr] md:gap-16 md:px-6 md:py-14">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-kv-gold-dark md:text-[13px]">KOVENIK Membership</p>
          <h2
            id="home-join"
            className="mt-2 font-oswald text-[32px] font-bold uppercase leading-none tracking-[0.04em] text-white md:text-[44px]"
          >
            Join the inner circle.
          </h2>
          <p className="mt-4 max-w-[480px] text-[15px] leading-[1.6] text-kv-mist md:text-[17px]">
            One membership for better prices on everything you wear.
            {plan && plan.discountPercent > 0 && <> {formatINR(plan.price)} a year.</>}
          </p>
          <Link
            href="/membership"
            className="mt-6 inline-flex min-h-[48px] items-center justify-center bg-kv-gold px-8 text-[14px] font-bold uppercase tracking-[0.1em] text-white transition-colors duration-200 hover:bg-[#B91F18] md:min-h-[52px] md:text-[15px]"
          >
            Join now
          </Link>
        </div>

        {plan && (
          <ul className="space-y-4 border-t border-white/15 pt-6 md:border-l md:border-t-0 md:pl-12 md:pt-0">
            {[
              plan.discountPercent > 0 ? `Flat ${plan.discountPercent}% off eligible products, every day` : 'Member prices on eligible products',
              'Free shipping on every order',
              'Member price shown right on every product',
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-[15px] leading-[1.5] text-white md:text-[16px]">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-kv-gold-dark" strokeWidth={2.2} aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
