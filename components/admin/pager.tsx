'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { Pagination } from '@/lib/admin-ops-api';

export function Pager({
  pagination,
  onPage,
  busy,
  noun = 'item',
}: {
  pagination: Pagination;
  onPage: (page: number) => void;
  busy?: boolean;
  noun?: string;
}) {
  const { page, totalPages, total } = pagination;
  if (total === 0) return null;

  const button =
    'flex h-9 w-9 items-center justify-center rounded-lg border border-[#D0D5DD] bg-white text-[#111111] transition hover:border-[#111111] disabled:opacity-40';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E4E7EC] px-5 py-3 text-[13px] text-[#626875]">
      <span>
        Page {page} of {totalPages} · {total} {noun}
        {total === 1 ? '' : 's'}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          className={button}
          aria-label="Previous page"
          disabled={page <= 1 || busy}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={button}
          aria-label="Next page"
          disabled={page >= totalPages || busy}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
