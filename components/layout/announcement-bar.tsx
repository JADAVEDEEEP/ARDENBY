'use client';

import { useEffect, useState } from 'react';

import { X } from 'lucide-react';

/** Charcoal strip above the header with one accent word and a close button. Scrolls away; the header sticks below. */
export function AnnouncementBar() {
  const [open, setOpen] = useState(true);

  // Pages that size themselves to the viewport (the hero) read --kv-top from <html>.
  useEffect(() => {
    document.documentElement.dataset.bar = open ? 'on' : 'off';
    return () => {
      delete document.documentElement.dataset.bar;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="note"
      data-kv-bar
      className="relative w-full bg-kv-ink px-10 py-2 text-center font-archivo text-[12px] font-semibold uppercase tracking-[0.08em] text-white sm:text-[16px] sm:tracking-[0.12em]"
    >
      Premium men&apos;s clothing crafted for the <span className="text-kv-gold-dark">bold</span>
      <button
        type="button"
        aria-label="Close announcement"
        onClick={() => setOpen(false)}
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-white/80 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
