'use client';

import { motion } from 'framer-motion';
import { LockKeyhole } from 'lucide-react';

export default function AdminLoginPage() {
  return (
    <main className="fixed inset-0 h-dvh w-screen overflow-hidden bg-[#f8f5f0]">
      <div className="grid h-full w-full grid-cols-1 lg:grid-cols-2">
        <section className="relative hidden h-full w-full overflow-hidden bg-black lg:block">
          <img
            src="/ardenby-fashion.png"
            alt="ARDENBY Campaign"
            className="absolute inset-0 h-full w-full object-cover object-[center_40%]"
          />
        </section>

        <section className="relative flex h-full w-full items-center justify-center overflow-y-auto bg-[#f8f5f0] px-8 sm:px-12 lg:px-16">
          <div className="flex w-full max-w-[380px] flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#e2d7c7] bg-transparent">
                <div className="text-center leading-none">
                  <span className="font-serif text-xl font-normal text-[#111]">
                    A
                  </span>
                </div>
              </div>

              <h1 className="mt-3 font-serif text-2xl font-normal uppercase tracking-[0.25em] text-[#1a1a1a]">
                ARDENBY
              </h1>

              <div className="flex items-center justify-center gap-3 pt-1.5">
                <span className="h-px w-5 bg-[#dfd0be]" />
                <span className="text-[8px] font-semibold uppercase tracking-[0.3em] text-[#a18158]">
                  Wear Your Essence
                </span>
                <span className="h-px w-5 bg-[#dfd0be]" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 space-y-1"
            >
              <h2 className="font-serif text-2xl font-normal text-[#1a1a1a]">
                Admin Access
              </h2>
              <p className="max-w-xs text-[11px] leading-relaxed text-[#736a60]">
                Admin login is not configured yet.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 w-full rounded-2xl border border-[#e7ddd1] bg-[#f0e8dc]/40 p-3.5"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8decf]">
                  <LockKeyhole className="h-4 w-4 text-[#9c7544]" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#252525]">
                    Private area
                  </p>
                  <p className="text-[9px] text-[#7a7167]">
                    Access will be enabled when the admin panel is ready.
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="mt-8">
              <p className="text-[8px] font-medium uppercase tracking-[0.35em] text-[#a3988c]">
                ARDENBY - Wear Your Essence
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
