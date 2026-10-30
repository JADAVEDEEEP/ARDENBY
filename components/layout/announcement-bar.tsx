const MESSAGE = "Premium men's clothing crafted for the bold";

/** Charcoal announcement strip with gold text. Scrolls away; the sticky header sits below. */
export function AnnouncementBar() {
  return (
    <div
      role="note"
      className="w-full bg-kv-ink px-4 py-2 text-center font-archivo text-[12px] font-semibold uppercase tracking-[0.08em] text-white sm:text-[14px] sm:tracking-[0.2em]"
    >
      {MESSAGE}
    </div>
  );
}
