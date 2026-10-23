'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';

import { clearReturnTo, rememberReturnTo } from '@/lib/auth-redirect';

const TOKEN_KEY = 'ardenby_token';

const readSignedIn = () => {
  try {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  } catch {
    return false;
  }
};

/**
 * Wraps a customer-only page (account, order details, wishlist, checkout).
 *
 * Signed out: nothing of the page is rendered, the page the customer wanted is
 * remembered and the sign-in dialog opens on the same URL. After a successful
 * sign-in the navbar sends them straight back to it. Server-side, every API
 * these pages call checks the account again, so this is only the front door.
 *
 * The first render (server and hydration) is neutral, so a refresh never flashes
 * the "sign in" screen at someone who is signed in.
 */
export function CustomerAuthGate({
  children,
  title = 'Sign in to continue',
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const pathname = usePathname();
  const [state, setState] = useState<'checking' | 'in' | 'out'>('checking');

  useEffect(() => {
    const sync = () => setState(readSignedIn() ? 'in' : 'out');

    sync();
    window.addEventListener('ardenby-auth-changed', sync);
    window.addEventListener('storage', sync);

    return () => {
      window.removeEventListener('ardenby-auth-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  useEffect(() => {
    if (state !== 'out') return;

    const search = typeof window !== 'undefined' ? window.location.search : '';

    rememberReturnTo(`${pathname}${search}`);
    window.dispatchEvent(new Event('ardenby-open-auth'));
  }, [state, pathname]);

  // Leaving while still signed out: forget the remembered page so a later,
  // unrelated sign-in does not jump back here.
  useEffect(
    () => () => {
      if (!readSignedIn()) clearReturnTo();
    },
    []
  );

  if (state === 'in') return <>{children}</>;

  return (
    <main className="kv-page flex min-h-[60vh] items-center justify-center px-4 py-16">
      {state === 'out' && (
        <div className="w-full max-w-md rounded-2xl border border-[#C9A24B]/25 bg-[#101010] p-8 text-center text-[#F3EBDD]">
          <Lock className="mx-auto h-8 w-8 text-[#C9A24B]" strokeWidth={1.4} />
          <h1 className="mt-4 font-serif text-2xl">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-[#F3EBDD]/70">
            Please sign in to your account to view this page. You will come straight back here.
          </p>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('ardenby-open-auth'))}
            className="mt-6 rounded-xl bg-[#C9A24B] px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#0A0A0A] transition hover:brightness-110"
          >
            Sign in
          </button>
        </div>
      )}
    </main>
  );
}
