'use client';

import { useNewsletterSubscribe } from '@/hooks/use-newsletter-subscribe';

export function Newsletter() {
  const { email, setEmail, available, handleSubscribe } = useNewsletterSubscribe();

  return (
    <section aria-labelledby="home-newsletter" className="on-dark bg-kv-ink py-12 md:py-16">
      <div className="mx-auto grid w-full max-w-[1280px] items-center gap-8 px-4 md:grid-cols-2 md:gap-14 md:px-6">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-kv-gold-dark md:text-[13px]">Kovenik newsletter</p>
          <h2
            id="home-newsletter"
            className="mt-3 font-oswald text-[30px] font-bold uppercase leading-none tracking-[0.04em] text-white md:text-[44px]"
          >
            Stay in the inner circle.
          </h2>
          <p className="mt-4 max-w-[540px] text-[15px] leading-[1.6] text-kv-mist md:text-[17px]">
            Updates on new drops and releases from KOVENIK.
          </p>
        </div>

        <form onSubmit={handleSubscribe} className="w-full min-w-0">
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!available}
              placeholder="Enter your email address"
              autoComplete="email"
              className="h-12 min-w-0 flex-none border border-white/40 sm:flex-1 bg-transparent px-4 text-[16px] text-white outline-none placeholder:text-kv-mist focus:border-kv-gold-dark md:h-[52px]"
            />
            <button
              type="submit"
              disabled={!available}
              className="inline-flex h-12 shrink-0 items-center justify-center bg-kv-gold px-8 text-[14px] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-kv-gold-dark disabled:cursor-not-allowed disabled:opacity-50 md:h-[52px] md:text-[15px]"
            >
              Join
            </button>
          </div>
          <p className="mt-3 text-[13px] leading-5 text-kv-mist md:text-[14px]">
            Newsletter sign-up is not available yet. Please check back soon.
          </p>
        </form>
      </div>
    </section>
  );
}
