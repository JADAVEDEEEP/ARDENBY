'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { unsubscribeNewsletter } from '@/lib/newsletter-api';

type State = 'ready' | 'loading' | 'done' | 'error';

/** The link in the email only OPENS this page. Unsubscribing is a button click (a POST), so mail scanners
 *  that pre-fetch links can never unsubscribe someone by accident. Mail apps with a built-in "Unsubscribe"
 *  button use the one-click header instead and never need this page. */
export function UnsubscribeClient() {
  const token = useSearchParams().get('token') ?? '';
  const [state, setState] = useState<State>(token ? 'ready' : 'error');
  const [message, setMessage] = useState(
    token ? '' : 'This unsubscribe link is not valid. Please use the link in the most recent email we sent you.'
  );

  const unsubscribe = async () => {
    setState('loading');
    const result = await unsubscribeNewsletter(token);
    setMessage(result.message);
    setState(result.ok ? 'done' : 'error');
  };

  const heading = state === 'done' ? 'You are unsubscribed' : state === 'error' ? 'Link problem' : 'Unsubscribe';

  return (
    <div aria-live="polite">
      <h1 className="mt-6 font-oswald text-[clamp(36px,8vw,64px)] font-bold uppercase leading-[1]">{heading}</h1>

      {(state === 'ready' || state === 'loading') && (
        <>
          <p className="mt-4 max-w-[52ch] text-[17px] leading-[1.7] text-[#444444]">
            Click the button to stop receiving KOVENIK newsletter emails. It takes effect immediately. Order and account
            emails are not affected.
          </p>
          <button
            type="button"
            onClick={unsubscribe}
            disabled={state === 'loading'}
            className="mt-8 inline-flex min-h-[52px] items-center justify-center bg-[#111111] px-8 text-[14px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#C62828] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state === 'loading' ? 'Unsubscribing…' : 'Unsubscribe me'}
          </button>
        </>
      )}

      {state === 'done' && (
        <p role="status" className="mt-4 max-w-[52ch] text-[17px] leading-[1.7] text-[#444444]">
          {message}
        </p>
      )}

      {state === 'error' && (
        <p
          role="alert"
          className="mt-4 max-w-[52ch] border-l-[4px] border-[#B3261E] bg-[#FDECEA] px-5 py-4 text-[16px] leading-[1.6] text-[#5F140F]"
        >
          {message}
        </p>
      )}

      {(state === 'done' || state === 'error') && (
        <Link
          href="/"
          className="mt-8 inline-flex min-h-[52px] items-center justify-center border-2 border-[#111111] px-8 text-[14px] font-bold uppercase tracking-[0.14em] transition-colors hover:bg-[#111111] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111]"
        >
          Back to KOVENIK
        </Link>
      )}
    </div>
  );
}
