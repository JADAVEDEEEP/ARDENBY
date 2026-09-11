'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  AlertCircle,
  Loader2,
  LockKeyhole,
} from 'lucide-react';

function GoogleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.27v3.1A11.996 11.996 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.27a12 12 0 0 0 0 10.78l4 3.1 4Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.61l4 3.1 4Z"
      />
    </svg>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  // --------------------------------------------------
  // CHECK ADMIN SESSION
  // --------------------------------------------------

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          setChecking(false);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Admin profile check failed:', profileError);
          setError('Unable to verify your account.');
          setChecking(false);
          return;
        }

        if (profile?.role === 'admin') {
          router.replace('/admin');
          return;
        }

        await supabase.auth.signOut();
        setError('This account is not authorized to access this area.');
      } catch (err) {
        console.error('Admin check error:', err);
        setError('Something went wrong. Please try again.');
      }

      setChecking(false);
    };

    checkAdmin();
  }, [router]);

  // --------------------------------------------------
  // GOOGLE LOGIN
  // --------------------------------------------------

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/admin/login`,
      },
    });

    if (error) {
      console.error('Google admin login error:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------

  if (checking) {
    return (
      <main className="fixed inset-0 h-dvh w-screen overflow-hidden bg-[#f8f5f0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border border-[#c99d5d] bg-white flex items-center justify-center shadow-sm">
            <span className="font-serif text-xl text-[#b1844b]">A</span>
          </div>
          <Loader2 className="w-5 h-5 animate-spin text-[#b1844b]" />
          <p className="text-[9px] tracking-[0.35em] uppercase text-[#8c7358]">
            Please wait
          </p>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // MAIN PAGE (Fixed, Exact 50/50 Grid Layout)
  // --------------------------------------------------

  return (
    <main className="fixed inset-0 h-dvh w-screen overflow-hidden bg-[#f8f5f0]">
      {/* Fixed 2-column grid — 1fr 1fr so dono columns exactly 50%-50% rahein */}
      <div className="grid h-full w-full grid-cols-1 lg:grid-cols-2">

        {/* =================================================
            LEFT — CAMPAIGN IMAGE (Fixed 50% Width)
        ================================================== */}
        <section className="relative hidden lg:block h-full w-full overflow-hidden bg-black">
          <img
            src="/ardenby-fashion.png"
            alt="ARDENBY Campaign"
            className="absolute inset-0 h-full w-full object-cover object-[center_40%]"
          />
        </section>

        {/* =================================================
            RIGHT — LOGIN FORM SECTION (Fixed 50% Width, Content Centered)
        ================================================== */}
        <section className="relative flex h-full w-full items-center justify-center overflow-y-auto bg-[#f8f5f0] px-8 sm:px-12 lg:px-16">
          <div className="w-full max-w-[380px] flex flex-col items-center text-center">

            {/* BRAND LOGO */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#e2d7c7] bg-transparent">
                <div className="text-center leading-none">
                  <span className="block text-[7px] font-serif text-[#111]">👑</span>
                  <span className="font-serif text-xl font-normal text-[#111]">A</span>
                </div>
              </div>

              <h1 className="mt-3 font-serif text-2xl font-normal tracking-[0.25em] text-[#1a1a1a] uppercase">
                ARDENBY
              </h1>

              <div className="flex items-center justify-center gap-3 pt-1.5">
                <span className="h-px w-5 bg-[#dfd0be]" />
                <span className="text-[8px] font-semibold tracking-[0.3em] text-[#a18158] uppercase">
                  Wear Your Essence
                </span>
                <span className="h-px w-5 bg-[#dfd0be]" />
              </div>
            </motion.div>

            {/* HEADING */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 space-y-1"
            >
              <h2 className="font-serif text-2xl font-normal text-[#1a1a1a]">
                Enter the House
              </h2>
              <p className="max-w-xs text-[11px] text-[#736a60] leading-relaxed">
                Continue with your authorized account to manage the ARDENBY experience.
              </p>
            </motion.div>

            {/* ERROR NOTICE */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-4 flex w-full items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/80 px-3.5 py-2.5 text-[11px] text-red-700 text-left"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* GOOGLE OAUTH BUTTON */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="group mt-6 flex w-full items-center justify-between rounded-2xl border border-[#e5dacd] bg-white p-3.5 shadow-sm transition-all duration-300 hover:border-[#b48b52] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#eee6db] bg-[#faf8f5]">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#a17b4b]" />
                  ) : (
                    <GoogleIcon className="h-4 w-4" />
                  )}
                </div>

                <div className="text-left">
                  <p className="text-[11px] font-bold tracking-wider text-[#1a1a1a]">
                    {loading ? 'CONNECTING...' : 'CONTINUE WITH GOOGLE'}
                  </p>
                  <p className="text-[9px] text-[#8a8075]">
                    Authorized account only
                  </p>
                </div>
              </div>

              {!loading && (
                <ArrowRight className="h-4 w-4 text-[#a17b4b] transition-transform duration-300 group-hover:translate-x-1" />
              )}
            </motion.button>

            {/* DIVIDER */}
            <div className="my-5 flex w-full items-center gap-3">
              <div className="h-px flex-1 bg-[#e2d7c9]" />
              <span className="text-[8px] font-semibold uppercase tracking-[0.25em] text-[#a0907e]">
                Private Access
              </span>
              <div className="h-px flex-1 bg-[#e2d7c9]" />
            </div>

            {/* SECURITY CARD */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-full rounded-2xl border border-[#e7ddd1] bg-[#f0e8dc]/40 p-3.5"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8decf]">
                  <LockKeyhole className="h-4 w-4 text-[#9c7544]" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#252525]">
                    A private space for ARDENBY
                  </p>
                  <p className="text-[9px] text-[#7a7167]">
                    Access is limited to authorized accounts.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* FOOTER */}
            <div className="mt-8">
              <p className="text-[8px] font-medium uppercase tracking-[0.35em] text-[#a3988c]">
                ARDENBY · Wear Your Essence
              </p>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}