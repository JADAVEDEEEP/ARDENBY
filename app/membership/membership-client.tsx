'use client';

import { useCallback, useEffect, useState } from 'react';
import { BellRing, Check, Loader2, Percent, Sparkles, Truck } from 'lucide-react';

import { MemberBadge } from '@/components/membership/member-badge';
import { clearReturnTo, rememberReturnTo } from '@/lib/auth-redirect';
import { errorText } from '@/lib/customer-api';
import { formatINR } from '@/lib/format';
import {
  fetchMembershipPlans,
  fetchMyMembership,
  formatDate,
  isBenefitLive,
  type MembershipPlan,
  type MyMembership,
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

const BENEFIT_ICON: Record<string, typeof Percent> = {
  DISCOUNT: Percent,
  EXCLUSIVE_OFFERS: Sparkles,
  NEW_LAUNCH_NOTIFICATIONS: BellRing,
  FREE_DELIVERY: Truck,
};

const termLabel = (days: number) => (days === 365 ? 'year' : `${days} days`);

/** What the button does. The server applies the same rule when it matters. */
function actionFor(mine: MyMembership | null) {
  if (!mine?.current) return { label: 'Join KOVENIK MEMBER', disabled: false };
  if (mine.queued) return { label: 'Already renewed', disabled: true };
  return { label: 'Renew membership', disabled: false };
}

export function MembershipClient() {
  const [plans, setPlans] = useState<MembershipPlan[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [mine, setMine] = useState<MyMembership | null>(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'opened' | 'verifying'>('idle');
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const loadMine = useCallback(async () => {
    if (!signedIn()) {
      setMine(null);
      return;
    }
    try {
      setMine(await fetchMyMembership());
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

  // The one membership plan. Everything shown comes from it, so admin edits show up here.
  const plan = plans && plans.length > 0 ? plans[0] : null;

  const join = async () => {
    if (!plan) return;
    setMessage(null);

    if (!signedIn()) {
      // After sign-in the navbar brings the customer back here.
      rememberReturnTo('/membership');
      window.dispatchEvent(new Event('ardenby-open-auth'));
      return;
    }
    clearReturnTo();

    setBusy(true);
    setPhase('idle');
    try {
      const result = await startMembershipPayment(plan.id, undefined, setPhase);
      if (result.status === 'paid') {
        setMessage({ tone: 'ok', text: 'Welcome to KOVENIK MEMBER! Your membership is now active.' });
        await loadMine();
        window.dispatchEvent(new Event('ardenby-membership-changed'));
      } else if (result.status === 'failed') {
        setMessage({ tone: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ tone: 'error', text: errorText(error) });
    } finally {
      setBusy(false);
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

  const action = actionFor(mine);
  const benefits = plan ? plan.benefits.filter(isBenefitLive) : [];
  // Purchases at which the discount repays the fee, from the live plan values.
  const breakEven = plan && plan.discountPercent > 0 ? Math.ceil(plan.price / (plan.discountPercent / 100)) : null;

  return (
    <main className="kv-page min-h-screen bg-white text-[#111111]">
      {/* Hero */}
      <section className="bg-[#111111] text-white">
        <div className="mx-auto max-w-[1100px] px-4 py-14 text-center md:px-8 md:py-24">
          <p className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.28em] text-[#FF8A87]">
            <MemberBadge size={20} label={false} /> KOVENIK MEMBER
          </p>
          <h1 className="font-oswald mx-auto mt-5 max-w-[14ch] text-[clamp(40px,8vw,84px)] font-bold uppercase leading-[0.98] tracking-tight">
            {plan ? `Flat ${plan.discountPercent}% off.` : 'Members save more.'}
            <br />
            All year.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[16px] leading-7 text-white/70 md:text-[18px]">
            One membership. One simple saving on every eligible product, every time you shop.
          </p>

          {plan && (
            <div className="mx-auto mt-10 flex max-w-sm flex-col items-center gap-4">
              <p className="flex items-baseline gap-2">
                <span className="text-[48px] font-bold leading-none tabular-nums">{formatINR(plan.price)}</span>
                <span className="text-[15px] text-white/60">/ {termLabel(plan.durationDays)}</span>
              </p>
              <button
                type="button"
                disabled={action.disabled || busy}
                onClick={join}
                className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[3px] bg-[#E53935] px-6 text-[13px] font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#C62E2B] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {busy ? (phase === 'verifying' ? 'Confirming payment…' : 'Opening payment…') : action.label}
              </button>
              {mine?.current && (
                <p className="text-[13px] text-white/70">
                  You are a member until <strong className="text-white">{formatDate(mine.current.endDate)}</strong>.
                </p>
              )}
              {mine?.queued && (
                <p className="text-[13px] text-white/70">
                  Renewal paid: your next year starts on <strong className="text-white">{formatDate(mine.queued.startDate)}</strong>.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-[1100px] px-4 py-12 md:px-8 md:py-16">
        {message && (
          <p
            role="status"
            className={cn(
              'mx-auto mb-10 max-w-xl rounded border px-4 py-3 text-center text-[14px]',
              message.tone === 'ok'
                ? 'border-[#1B7A43]/40 bg-[#1B7A43]/10 text-[#14602F]'
                : 'border-[#D92D20]/40 bg-[#D92D20]/10 text-[#B42318]'
            )}
          >
            {message.text}
          </p>
        )}

        {plans === null && !loadError && (
          <div className="grid gap-5 md:grid-cols-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded bg-[#F5F5F5]" />
            ))}
          </div>
        )}

        {loadError && (
          <p className="text-center text-[15px] text-[#B42318]">
            We could not load the membership right now. Please try again in a moment.
          </p>
        )}

        {plans && !plan && !loadError && (
          <p className="text-center text-[15px] text-[#555555]">Membership is not available at the moment.</p>
        )}

        {plan && (
          <>
            {/* What you get */}
            <h2 className="text-center text-[12px] font-semibold uppercase tracking-[0.24em] text-[#666666]">What you get</h2>
            <ul className="mx-auto mt-8 flex max-w-[1100px] flex-wrap justify-center gap-4">
              {benefits.map((b) => {
                const Icon = BENEFIT_ICON[b.type.toUpperCase()] ?? Check;
                return (
                  <li key={b.id} className="flex w-full flex-col items-start gap-4 rounded border border-[#E5E5E5] bg-white p-6 md:w-[calc(33.333%-0.75rem)] md:min-w-[280px] md:p-8">
                    <Icon className="h-6 w-6 text-[#E53935]" strokeWidth={1.8} aria-hidden />
                    <p className="text-[16px] font-semibold leading-snug">{b.description}</p>
                  </li>
                );
              })}
            </ul>

            {breakEven && (
              <p className="mx-auto mt-8 max-w-xl text-center text-[15px] leading-7 text-[#444444]">
                It pays for itself once you have shopped about <strong>{formatINR(breakEven)}</strong> at selling prices (less if you count the shipping you save), and
                everything after that is savings.
              </p>
            )}

            {/* How it works */}
            <h2 className="mt-16 text-center text-[12px] font-semibold uppercase tracking-[0.24em] text-[#666666]">How it works</h2>
            <ol className="mt-8 grid gap-8 md:grid-cols-3">
              {[
                ['Join', `Pay ${formatINR(plan.price)} once. Your membership is active straight away.`],
                ['Shop', `Member prices show on eligible products. ${plan.discountPercent}% comes off the selling price automatically, sale items included, and shipping is free.`],
                ['Save', 'Your savings are shown in the cart and at checkout before you pay.'],
              ].map(([title, text], i) => (
                <li key={title} className="text-center">
                  <span className="font-oswald mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#111111] text-[18px] font-bold">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-[18px] font-bold">{title}</h3>
                  <p className="mx-auto mt-1 max-w-[30ch] text-[14.5px] leading-6 text-[#555555]">{text}</p>
                </li>
              ))}
            </ol>
          </>
        )}

        <p className="mx-auto mt-14 max-w-2xl text-center text-[13px] leading-6 text-[#666666]">
          The member discount is taken off the current selling price of eligible products, sale items included, and is
          confirmed at checkout. Sale price, member discount and coupons together are limited so the total never exceeds
          our maximum combined discount off the list price (MRP). Renewing extends your membership from its end date.
          Payments are processed securely by Razorpay.
        </p>
      </div>
    </main>
  );
}
