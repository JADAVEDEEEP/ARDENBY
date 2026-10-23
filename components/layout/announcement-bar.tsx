'use client';

const MESSAGE = "Premium men's clothing crafted for the bold";

/** Dark chrome announcement ribbon. Scrolls away; the sticky header sits below. */
export function AnnouncementBar() {
  return (
    <div
      role="note"
      className="flex w-full items-center justify-center gap-3 border-b border-white/10 bg-[linear-gradient(180deg,#1a1c20_0%,#07080a_100%)] px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-[#c4c8cf] sm:text-[11px]"
      style={{ fontFamily: 'var(--font-archivo), Inter, Arial, sans-serif' }}
    >
      <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-[#c9a24a]" />
      {MESSAGE}
      <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-[#c9a24a]" />
    </div>
  );
}
