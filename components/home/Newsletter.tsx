'use client';

import { Loader2, Mail } from 'lucide-react';
import Link from 'next/link';

import { NEWSLETTER_CONSENT_TEXT, useNewsletterSubscribe } from '@/hooks/use-newsletter-subscribe';

/**
 * Newsletter: a plain full-width row on white (no card, border or tinted background), so it stays distinct
 * from the off-white footer below. Sign-up is double opt-in: joining only sends a confirmation email, and the
 * address becomes a subscriber when the visitor clicks the link in it. The success message never claims more.
 */
export function Newsletter() {
  const { email, setEmail, website, setWebsite, status, message, handleSubscribe } = useNewsletterSubscribe();
  const loading = status === 'loading';
  const hasError = status === 'error';

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

          <form onSubmit={handleSubscribe} noValidate className="relative w-full">
            <label htmlFor="newsletter-email" className="mb-2 block text-[12px] font-bold uppercase tracking-[0.16em] text-kv-ink">
              Email address
            </label>
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <input
                id="newsletter-email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="you@example.com"
                autoComplete="email"
                maxLength={254}
                aria-invalid={hasError}
                aria-describedby="newsletter-feedback newsletter-consent"
                className="h-[52px] min-w-0 flex-none border border-kv-ink/30 bg-white px-4 text-[16px] text-kv-ink outline-none transition-colors placeholder:text-kv-sub focus:border-kv-ink disabled:cursor-not-allowed disabled:bg-white/60 aria-[invalid=true]:border-[#B3261E] sm:flex-1"
              />
              {/* Honeypot: invisible to people and screen readers; bots fill it in. */}
              <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="newsletter-website">Website</label>
                <input
                  id="newsletter-website"
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-[52px] shrink-0 items-center justify-center gap-2 bg-kv-gold px-8 text-[14px] font-bold uppercase tracking-[0.1em] text-white transition-colors duration-200 hover:bg-[#B91F18] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-kv-gold md:text-[15px]"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {loading ? 'Joining' : 'Join'}
              </button>
            </div>

            <div id="newsletter-feedback" role={hasError ? 'alert' : 'status'} aria-live="polite">
              {message && (
                <p
                  className={`mt-3 text-[14px] font-medium leading-5 md:text-[15px] ${
                    hasError ? 'text-[#B3261E]' : 'text-[#1B6B3A]'
                  }`}
                >
                  {message}
                </p>
              )}
            </div>
            <p id="newsletter-consent" className="mt-3 text-[13px] leading-5 text-kv-sub md:text-[14px]">
              {NEWSLETTER_CONSENT_TEXT}{' '}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-kv-ink">
                Privacy Policy
              </Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
