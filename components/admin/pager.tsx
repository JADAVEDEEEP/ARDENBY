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
    'flex h-9 w-9 items-center justify-center rounded-lg border border-[#E3E5EE] bg-white text-[#11162B] transition hover:border-[#E3E5EE] disabled:opacity-40';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E3E5EE] px-5 py-3 text-[14px] text-[#5A6075]">
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
