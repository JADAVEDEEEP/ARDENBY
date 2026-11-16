'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { confirmNewsletter } from '@/lib/newsletter-api';

type State = 'ready' | 'loading' | 'done' | 'error';

/** The link in the email only OPENS this page. Confirming needs a click on the button (a POST), so mail
 *  scanners that pre-fetch links can never confirm an address on the owner's behalf. */
export function ConfirmClient() {
  const token = useSearchParams().get('token') ?? '';
  const [state, setState] = useState<State>(token ? 'ready' : 'error');
  const [message, setMessage] = useState(
    token ? '' : 'This confirmation link is not valid. Please sign up again from the KOVENIK homepage.'
  );

  const confirm = async () => {
    setState('loading');
    const result = await confirmNewsletter(token);
    setMessage(result.message);
    setState(result.ok ? 'done' : 'error');
  };

  const heading = state === 'done' ? 'You are in' : state === 'error' ? 'Link problem' : 'Confirm your email';

  return (
    <div aria-live="polite">
      <h1 className="mt-6 font-oswald text-[clamp(36px,8vw,64px)] font-bold uppercase leading-[1]">{heading}</h1>

      {(state === 'ready' || state === 'loading') && (
        <>
          <p className="mt-4 max-w-[52ch] text-[17px] leading-[1.7] text-[#444444]">
            One last step. Confirm that you want to receive KOVENIK updates, new arrivals and limited-drop announcements.
            You can unsubscribe anytime.
          </p>
          <button
            type="button"
            onClick={confirm}
            disabled={state === 'loading'}
            className="mt-8 inline-flex min-h-[52px] items-center justify-center bg-[#111111] px-8 text-[14px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#C62828] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state === 'loading' ? 'Confirming…' : 'Confirm my email'}
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
