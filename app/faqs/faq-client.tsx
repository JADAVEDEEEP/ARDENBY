'use client';

import Link from 'next/link';
import { useId, useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

import { FAQ_CATEGORIES, FAQS } from './faq-data';
import type { FaqCategory, FaqItem } from './faq-data';

type Filter = 'All' | FaqCategory;

const normalize = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s]/gu, ' ');

function matches(item: FaqItem, terms: string[]) {
  if (terms.length === 0) return true;
  const haystack = normalize(`${item.q} ${item.a} ${item.category}`);
  return terms.every((t) => haystack.includes(t));
}

function Row({
  item,
  open,
  onToggle,
  showCategory,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
  showCategory: boolean;
}) {
  const panelId = useId();
  return (
    <li className="border-b border-[#D9D9D9]">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="group flex min-h-[64px] w-full items-start justify-between gap-5 py-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C62828]"
        >
          <span className="min-w-0">
            {showCategory && (
              <span className="mb-1 block text-[12px] font-bold uppercase tracking-[0.18em] text-[#C62828]">
                {item.category}
              </span>
            )}
            <span
              className={cn(
                'block text-[19px] font-semibold leading-snug transition-colors md:text-[22px]',
                open ? 'text-[#C62828]' : 'text-[#111111] group-hover:text-[#C62828]'
              )}
            >
              {item.q}
            </span>
          </span>
          <span
            aria-hidden="true"
            className={cn(
              'mt-1 flex h-9 w-9 shrink-0 items-center justify-center border-2 text-[22px] leading-none transition-all duration-300',
              open ? 'rotate-45 border-[#C62828] bg-[#C62828] text-white' : 'border-[#111111] text-[#111111] group-hover:border-[#C62828] group-hover:text-[#C62828]'
            )}
          >
            +
          </span>
        </button>
      </h3>
      {/* grid-rows 0fr -> 1fr animates height without measuring */}
      <div
        id={panelId}
        role="region"
        aria-label={item.q}
        className={cn(
          'grid transition-[grid-template-rows,opacity,visibility] duration-300 ease-out motion-reduce:transition-none',
          open ? 'visible grid-rows-[1fr] opacity-100' : 'invisible grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="max-w-[68ch] pb-7 pr-12 text-[17px] leading-[1.75] text-[#3A3A3A] md:text-[18px]">
            {item.a.split('\n\n').map((p) => (
              <p key={p} className="[&+p]:mt-4">
                {p}
              </p>
            ))}
            {item.link && (
              <Link
                href={item.link.href}
                tabIndex={open ? 0 : -1}
                className="mt-4 inline-block text-[15px] font-bold uppercase tracking-[0.12em] text-[#C62828] underline underline-offset-4 hover:text-[#A91F1F]"
              >
                {item.link.label} →
              </Link>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

export function FaqClient() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const [openId, setOpenId] = useState<string | null>(null);
  const searchId = useId();

  const terms = useMemo(() => normalize(query).split(/\s+/).filter(Boolean), [query]);

  const counts = useMemo(() => {
    const byCategory = new Map<Filter, number>([['All', 0]]);
    for (const c of FAQ_CATEGORIES) byCategory.set(c, 0);
    for (const item of FAQS) {
      if (!matches(item, terms)) continue;
      byCategory.set('All', (byCategory.get('All') ?? 0) + 1);
      byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + 1);
    }
    return byCategory;
  }, [terms]);

  const visible = useMemo(
    () => FAQS.filter((item) => (filter === 'All' || item.category === filter) && matches(item, terms)),
    [filter, terms]
  );

  const reset = () => {
    setQuery('');
    setFilter('All');
  };

  return (
    <div>
      {/* Search + filters */}
      <div className="border-b border-[#E5E5E5] bg-white py-6 md:py-8">
        <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10">
          <form role="search" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor={searchId} className="sr-only">
              Search the FAQ
            </label>
            <div className="relative">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-[#555555]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                id={searchId}
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpenId(null);
                }}
                placeholder="Search orders, shipping, returns, sizing…"
                autoComplete="off"
                className="h-[60px] w-full border-2 border-[#111111] bg-white pl-14 pr-4 text-[17px] text-[#111111] outline-none placeholder:text-[#6B6B6B] focus:border-[#C62828] md:h-[68px] md:text-[19px]"
              />
            </div>
          </form>

          <div role="group" aria-label="Filter by category" className="mt-5 flex flex-wrap gap-2">
            {(['All', ...FAQ_CATEGORIES] as Filter[]).map((c) => {
              const active = filter === c;
              const count = counts.get(c) ?? 0;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setFilter(c);
                    setOpenId(null);
                  }}
                  className={cn(
                    'min-h-[44px] border-2 px-4 text-[14px] font-bold uppercase tracking-[0.1em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C62828]',
                    active
                      ? 'border-[#C62828] bg-[#C62828] text-white'
                      : 'border-[#D9D9D9] bg-white text-[#111111] hover:border-[#111111]'
                  )}
                >
                  {c} <span className={cn('font-medium', active ? 'text-white/85' : 'text-[#6B6B6B]')}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 md:py-14 lg:px-10">
        <p role="status" aria-live="polite" className="mb-2 text-[14px] font-semibold uppercase tracking-[0.16em] text-[#555555]">
          {visible.length === 0
            ? 'No matching questions'
            : `${visible.length} ${visible.length === 1 ? 'question' : 'questions'}${filter !== 'All' ? ` in ${filter}` : ''}`}
        </p>

        {visible.length > 0 ? (
          <ul className="border-t-2 border-[#111111]">
            {visible.map((item) => (
              <Row
                key={item.id}
                item={item}
                open={openId === item.id}
                onToggle={() => setOpenId(openId === item.id ? null : item.id)}
                showCategory={filter === 'All'}
              />
            ))}
          </ul>
        ) : (
          <div className="border-2 border-dashed border-[#BDBDBD] bg-[#F5F5F5] px-6 py-14 text-center md:py-20">
            <p className="font-oswald text-[clamp(28px,5vw,44px)] font-bold uppercase leading-[1]">
              Nothing found{query.trim() ? <> for “{query.trim()}”</> : null}
            </p>
            <p className="mx-auto mt-4 max-w-[46ch] text-[17px] leading-[1.7] text-[#444444]">
              Try a shorter or different word, switch category, or ask us directly and we will help.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-[52px] items-center justify-center border-2 border-[#111111] px-8 text-[14px] font-bold uppercase tracking-[0.14em] text-[#111111] transition-colors hover:bg-[#111111] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111]"
              >
                Clear search
              </button>
              <Link
                href="/contact"
                className="inline-flex min-h-[52px] items-center justify-center bg-[#C62828] px-8 text-[14px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#A91F1F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C62828]"
              >
                Contact support
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Always-visible fallback */}
      <div className="bg-[#111111] py-14 text-white md:py-16">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-start justify-between gap-6 px-4 sm:px-6 md:flex-row md:items-center lg:px-10">
          <div>
            <p className="font-oswald text-[clamp(30px,5vw,48px)] font-bold uppercase leading-[1]">Still need an answer?</p>
            <p className="mt-3 max-w-[44ch] text-[17px] leading-[1.6] text-[#D6D6D6]">
              Send us your question with your order number, if you have one, and we will get back to you.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex min-h-[52px] shrink-0 items-center justify-center bg-white px-8 text-[14px] font-bold uppercase tracking-[0.14em] text-[#111111] transition-colors hover:bg-[#FFEBEE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
