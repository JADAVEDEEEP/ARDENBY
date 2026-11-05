'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

import { clearReturnTo, rememberReturnTo } from '@/lib/auth-redirect';
import { errorText } from '@/lib/customer-api';
import { formatINR } from '@/lib/format';
import {
  fetchMembershipPlans,
  fetchMyMembership,
  formatDate,
  type MembershipPlan,
  type MyMembership,
  isBenefitLive,
  liveText,
} from '@/lib/membership-api';
import { startMembershipPayment, syncMembershipPayment } from '@/lib/razorpay-checkout';
import { cn } from '@/lib/utils';

const signedIn = () => {
  try {
    return Boolean(localStorage.getItem('ardenby_token'));
  } catch {
    return false;
  }
};

/** What the button does for this plan. The server applies the same rule when it matters. */
function actionFor(plan: MembershipPlan, mine: MyMembership | null) {
  const current = mine?.current;
  if (!current) return { label: `Join ${plan.name}`, disabled: false };
  if (plan.tierRank < current.tierRank) return { label: 'Included in your plan', disabled: true };
  if (plan.tierRank > current.tierRank) return { label: `Upgrade to ${plan.name}`, disabled: false };
  if (mine?.queued) return { label: 'Already renewed', disabled: true };
  return { label: `Renew ${plan.name}`, disabled: false };
}

export function MembershipClient() {
  const params = useSearchParams();
  const wantedSlug = params.get('plan');

  const [plans, setPlans] = useState<MembershipPlan[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [mine, setMine] = useState<MyMembership | null>(null);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [phase, setPhase] = useState<'idle' | 'opened' | 'verifying'>('idle');
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const loadMine = useCallback(async () => {
    if (!signedIn()) {
      setMine(null);
      return;
    }
    try {
      const data = await fetchMyMembership();
      setMine(data);
    } catch {
      setMine(null);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchMembershipPlans(controller.signal)
      .then(setPlans)
      .catch((error) => {
        if (!controller.signal.aborted) setLoadError(errorText(error));
      });
    void loadMine();

    window.addEventListener('ardenby-auth-changed', loadMine);
    return () => {
      controller.abort();
      window.removeEventListener('ardenby-auth-changed', loadMine);
    };
  }, [loadMine]);

  const join = async (plan: MembershipPlan) => {
    setMessage(null);

    if (!signedIn()) {
      // Remember the chosen plan; after sign-in the navbar brings the customer back here.
      rememberReturnTo(`/membership?plan=${encodeURIComponent(plan.slug)}`);
      window.dispatchEvent(new Event('ardenby-open-auth'));
      return;
    }
    clearReturnTo();

    setBusySlug(plan.slug);
    setPhase('idle');
    try {
      const result = await startMembershipPayment(plan.id, undefined, setPhase);
      if (result.status === 'paid') {
        setMessage({ tone: 'ok', text: `Welcome to ${plan.name}! Your membership is now active.` });
        await loadMine();
        window.dispatchEvent(new Event('ardenby-membership-changed'));
      } else if (result.status === 'failed') {
        setMessage({ tone: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ tone: 'error', text: errorText(error) });
    } finally {
      setBusySlug(null);
      setPhase('idle');
    }
  };

  // Paid but never came back last time? Ask the server to double-check once.
  useEffect(() => {
    const pending = mine?.history.find((h) => h.status === 'pending' && h.paymentStatus === 'created' && h.razorpayOrderId);
    if (pending?.razorpayOrderId) {
      void syncMembershipPayment(pending.razorpayOrderId)
        .then((ok) => {
          if (!ok) return undefined;
          window.dispatchEvent(new Event('ardenby-membership-changed'));
          return loadMine();
        })
        .catch(() => undefined);
    }
    // Only when the history first loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mine?.history.length]);

  const topRank = plans?.reduce((max, p) => Math.max(max, p.tierRank), 0) ?? 0;

  return (
    <main className="kv-page min-h-screen bg-white text-[#111111]">
      <div className="mx-auto max-w-[1180px] px-4 py-10 md:px-8 md:py-16">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#E53935]">KÖVENIK Membership</p>
          <h1 className="mt-3 text-[32px] font-bold leading-tight tracking-tight md:text-[44px]">Pay once. Save all year.</h1>
          <p className="mt-3 text-[16px] leading-7 text-[#555555]">
            Member prices on eligible products and more. Choose the plan that fits you.
          </p>
        </header>

        {mine?.current && (
          <p className="mx-auto mt-8 max-w-xl rounded border border-[#111111]/15 bg-[#F7F7F7] px-4 py-3 text-center text-[14px]">
            You are a <strong>{mine.current.planName}</strong> member until{' '}
            <strong>{formatDate(mine.current.endDate)}</strong>.
          </p>
        )}

        {message && (
          <p
            role="status"
            className={cn(
              'mx-auto mt-6 max-w-xl rounded border px-4 py-3 text-center text-[14px]',
              message.tone === 'ok'
                ? 'border-[#1B7A43]/40 bg-[#1B7A43]/10 text-[#14602F]'
                : 'border-[#D92D20]/40 bg-[#D92D20]/10 text-[#B42318]'
            )}
          >
            {message.text}
          </p>
        )}

        {plans === null && !loadError && (
          <div className="mt-12 grid gap-5 md:grid-cols-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[420px] animate-pulse rounded bg-[#F5F5F5]" />
            ))}
          </div>
        )}

        {loadError && (
          <p className="mt-12 text-center text-[15px] text-[#B42318]">
            We could not load the membership plans right now. Please try again in a moment.
          </p>
        )}

        {plans && plans.length === 0 && !loadError && (
          <p className="mt-12 text-center text-[15px] text-[#555555]">Membership plans are not available at the moment.</p>
        )}

        {plans && plans.length > 0 && (
          <ul className="mt-10 grid gap-5 md:mt-14 md:grid-cols-3">
            {plans.map((plan) => {
              const action = actionFor(plan, mine);
              const featured = plan.tierRank === topRank && plans.length > 1;
              const chosen = wantedSlug === plan.slug;
              const busy = busySlug === plan.slug;
              const isCurrent = mine?.current?.planId === plan.id;
              return (
                <li
                  key={plan.id}
                  className={cn(
                    'relative flex flex-col rounded border bg-white p-6 md:p-7',
                    featured ? 'border-[#111111] shadow-[0_8px_30px_rgba(0,0,0,0.08)]' : 'border-[#E5E5E5]',
                    chosen && 'ring-2 ring-[#E53935]'
                  )}
                >
                  {featured && (
                    <span className="absolute -top-3 left-6 rounded-[3px] bg-[#111111] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                      Best value
                    </span>
                  )}
                  <h2 className="text-[22px] font-bold">{plan.name}</h2>
                  {liveText(plan.description) && <p className="mt-1 text-[14px] leading-6 text-[#666666]">{liveText(plan.description)}</p>}

                  <p className="mt-5 flex items-baseline gap-2">
                    <span className="text-[38px] font-bold leading-none tabular-nums">{formatINR(plan.price)}</span>
                    <span className="text-[14px] text-[#666666]">
                      / {plan.durationDays === 365 ? 'year' : `${plan.durationDays} days`}
                    </span>
                  </p>
                  {plan.discountPercent > 0 && (
                    <p className="mt-2 text-[14px] font-semibold text-[#1B7A43]">{plan.discountPercent}% off eligible products</p>
                  )}

                  <ul className="mt-5 space-y-2.5 text-[14.5px] leading-6">
                    {plan.benefits.filter(isBenefitLive).map((b) => (
                      <li key={b.id} className="flex gap-2.5">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-[#1B7A43]" strokeWidth={2.4} aria-hidden />
                        <span>{b.description}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-7">
                    <button
                      type="button"
                      disabled={action.disabled || busySlug !== null}
                      onClick={() => join(plan)}
                      className={cn(
                        'flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[3px] px-5 text-[13px] font-bold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-50',
                        featured ? 'bg-[#E53935] text-white hover:bg-[#C62E2B]' : 'bg-[#111111] text-white hover:bg-[#2A2A2A]'
                      )}
                    >
                      {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                      {busy ? (phase === 'verifying' ? 'Confirming payment…' : 'Opening payment…') : action.label}
                    </button>
                    {isCurrent && <p className="mt-2 text-center text-[12.5px] text-[#666666]">This is your current plan.</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="mx-auto mt-10 max-w-2xl text-center text-[13px] leading-6 text-[#666666]">
          Member prices apply to eligible products and are confirmed at checkout. Discounts from sale prices, member prices and
          coupons are limited so they never exceed our maximum combined discount. Renewing extends your plan from its end date;
          upgrading starts the higher plan today. Payments are processed securely by Razorpay.
        </p>
      </div>
    </main>
  );
}
