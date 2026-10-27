'use client';

import { useId, useState } from 'react';
import { ChevronUp, Plus } from 'lucide-react';

/** Sidebar accordion group: uppercase heading, chevron when open, "+" when collapsed. */
export function FilterGroup({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  return (
    <section className="border-b border-[var(--line-2)] py-5">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="kvl-eyebrow flex w-full text-[13px] items-center justify-between text-left text-[var(--ink)]"
        >
          {title}
          {open ? <ChevronUp className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
        </button>
      </h3>
      <div id={panelId} hidden={!open} className="pt-3.5">
        {children}
      </div>
    </section>
  );
}
