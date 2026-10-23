'use client';

import { ArrowRight, Mail } from 'lucide-react';

import { useNewsletterSubscribe } from '@/hooks/use-newsletter-subscribe';

import { Reveal } from './ui/Reveal';

export function Newsletter() {
  const { email, setEmail, subscribed, handleSubscribe } = useNewsletterSubscribe();

  return (
    <section
      aria-label="Newsletter"
      className="bg-kv-bg px-4 pb-16 pt-8 sm:px-8 sm:pb-20 lg:px-12 lg:pb-24"
    >
      <Reveal className="chrome-glass mx-auto grid max-w-[1200px] items-end gap-8 rounded-3xl p-6 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:p-14">
        <div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.26em] text-kv-gold">
            Kovenik newsletter
          </p>
          <h2 className="chrome-text max-w-[760px] font-bodoni text-[clamp(30px,4.2vw,60px)] font-medium uppercase leading-[0.98]">
            Stay in the inner circle.
          </h2>
          <p className="mt-5 max-w-[540px] text-[14px] leading-[1.7] text-kv-body sm:text-[15px]">
            Get first access to new drops, exclusive collections, private releases and 10%
            off your first order.
          </p>
        </div>

        <form onSubmit={handleSubscribe} className="group w-full min-w-0">
          <div className="flex min-h-[60px] w-full items-center overflow-hidden rounded-full border border-white/20 bg-black/40 transition-colors duration-300 focus-within:border-white/60 sm:min-h-[68px]">
            <Mail className="ml-5 h-5 w-5 shrink-0 text-kv-muted sm:ml-6" strokeWidth={1.4} />

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              aria-label="Email address"
              className="min-w-0 flex-1 bg-transparent px-3 text-[14px] text-kv-head outline-none placeholder:text-kv-muted sm:px-4 sm:text-[15px]"
            />

            <button
              type="submit"
              disabled={subscribed}
              className="chrome-focus gold-fill gold-sheen mr-1.5 flex h-[48px] shrink-0 items-center gap-2 rounded-full px-5 text-[11px] font-bold uppercase tracking-[0.16em] transition duration-300 hover:brightness-110 disabled:opacity-80 sm:mr-2 sm:h-[52px] sm:px-7"
            >
              <span>{subscribed ? 'Joined' : 'Join'}</span>
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                strokeWidth={2}
              />
            </button>
          </div>

          <p className="mt-3 pl-2 text-[12px] leading-relaxed text-kv-muted">
            By subscribing, you agree to receive KOVENIK updates, product launches and
            offers.
          </p>
        </form>
      </Reveal>
    </section>
  );
}
