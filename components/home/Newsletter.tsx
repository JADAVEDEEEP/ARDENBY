'use client';

import { Mail } from 'lucide-react';

import { NEWSLETTER_UNAVAILABLE_TEXT, useNewsletterSubscribe } from '@/hooks/use-newsletter-subscribe';

/**
 * Newsletter: a plain full-width row on white (no card, border or tinted background), so it stays distinct
 * from the off-white footer below. The form is disabled and says so until a real subscriber endpoint exists
 * (see use-newsletter-subscribe.ts); it never pretends to save.
 */
export function Newsletter() {
  const { email, setEmail, available, handleSubscribe } = useNewsletterSubscribe();

  return (
    <section aria-labelledby="home-newsletter" className="w-full bg-kv-bg py-10 md:py-14">
      <div className="kv-gutter w-full">
        <div className="grid w-full items-center gap-8 md:grid-cols-2 md:gap-16">
          <div>
            <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-kv-gold-text md:text-[13px]">
              <Mail className="h-4 w-4" aria-hidden="true" /> Newsletter
            </p>
            <h2
              id="home-newsletter"
              className="mt-3 font-oswald text-[30px] font-bold uppercase leading-[1.05] tracking-[0.03em] text-kv-ink md:text-[44px]"
            >
              Stay in the
              <br />
              inner circle
            </h2>
            <p className="mt-4 max-w-[420px] text-[15px] leading-[1.6] text-kv-sub md:text-[17px]">
              Get exclusive updates, new arrivals and limited-drop announcements.
            </p>
          </div>

          <form onSubmit={handleSubscribe} noValidate className="w-full">
            <label htmlFor="newsletter-email" className="mb-2 block text-[12px] font-bold uppercase tracking-[0.16em] text-kv-ink">
              Email address
            </label>
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!available}
                placeholder="you@example.com"
                autoComplete="email"
                className="h-[52px] min-w-0 flex-none border border-kv-ink/30 bg-white px-4 text-[16px] text-kv-ink outline-none transition-colors placeholder:text-kv-sub focus:border-kv-ink disabled:cursor-not-allowed disabled:bg-white/60 sm:flex-1"
              />
              <button
                type="submit"
                disabled={!available}
                className="inline-flex h-[52px] shrink-0 items-center justify-center bg-kv-gold px-8 text-[14px] font-bold uppercase tracking-[0.1em] text-white transition-colors duration-200 hover:bg-[#B91F18] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-kv-gold md:text-[15px]"
              >
                Join
              </button>
            </div>
            {!available && <p className="mt-3 text-[13px] leading-5 text-kv-sub md:text-[14px]">{NEWSLETTER_UNAVAILABLE_TEXT}</p>}
          </form>
        </div>
      </div>
    </section>
  );
}
