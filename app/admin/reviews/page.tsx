'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EyeOff, RefreshCw, Star } from 'lucide-react';

import { Pager } from '@/components/admin/pager';
import { ReasonDialog } from '@/components/admin/reason-dialog';
import {
  Card,
  EmptyState,
  Notice,
  PageHeader,
  Spinner,
  StatusPill,
  btnDanger,
  btnOutline,
  fieldClass,
} from '@/components/admin/ui';
import { Pagination, message, opsRequest, toQuery, when } from '@/lib/admin-ops-api';

type Review = {
  id: string;
  productName: string;
  productSlug: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  createdAt: string | null;
  hidden: boolean;
  moderation: { status: string; reason: string; by: string; at: string | null } | null;
};

/** Hide / unhide customer reviews. Reviews are never deleted; every action needs a reason and is logged. */
export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [status, setStatus] = useState('');
  const [rating, setRating] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<Review | null>(null);
  const latest = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    const request = ++latest.current;
    setLoading(true);
    setError('');
    try {
      const data = await opsRequest(`/api/admin/reviews${toQuery({ page, limit: 15, status, rating, search })}`);
      if (request !== latest.current) return;
      setReviews(data.reviews || []);
      setPagination(data.pagination || null);
    } catch (e) {
      if (request === latest.current) setError(message(e));
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, [page, status, rating, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (reason: string) => {
    if (!target) return;
    await opsRequest(`/api/admin/reviews/${encodeURIComponent(target.id)}/moderation`, {
      method: 'PATCH',
      body: JSON.stringify({ action: target.hidden ? 'unhide' : 'hide', reason }),
    });
    setNotice(target.hidden ? 'Review is visible again.' : 'Review hidden from the store.');
    setTarget(null);
    await load();
  };

  return (
    <div>
      <PageHeader
        title="Reviews"
        subtitle="Hide abusive or false reviews. A hidden review stays in the database and can be restored. Customers can still only review products they received."
        actions={
          <button type="button" className={btnOutline} onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          className={`${fieldClass} sm:max-w-xs`}
          placeholder="Search product, title, text or name"
          aria-label="Search reviews"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select
          className={`${fieldClass} sm:max-w-[180px]`}
          aria-label="Filter by visibility"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All reviews</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
        </select>
        <select
          className={`${fieldClass} sm:max-w-[160px]`}
          aria-label="Filter by rating"
          value={rating}
          onChange={(e) => {
            setRating(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Any rating</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n === 1 ? '' : 's'}
            </option>
          ))}
        </select>
      </div>

      {notice && (
        <Notice tone="success" className="mb-4">
          {notice}
        </Notice>
      )}
      {error && (
        <Notice tone="error" className="mb-4">
          {error}
        </Notice>
      )}

      <Card bodyClassName="p-0">
        {loading && reviews.length === 0 ? (
          <Spinner label="Loading reviews" />
        ) : reviews.length === 0 ? (
          <EmptyState icon={Star} title="No reviews found">
            {status || rating || search ? 'Try different filters.' : 'Reviews appear here once customers post them.'}
          </EmptyState>
        ) : (
          <ul className="divide-y divide-[#E3E5EE]" aria-busy={loading}>
            {reviews.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[#11162B]">{r.productName}</span>
                    <span className="text-[14px] text-[#7A4F00]" aria-label={`${r.rating} out of 5`}>
                      {'★'.repeat(Math.round(r.rating))}
                      <span className="text-[#5A6075]">{'★'.repeat(5 - Math.round(r.rating))}</span>
                    </span>
                    {r.verified && <StatusPill tone="success">Verified buyer</StatusPill>}
                    {r.hidden && <StatusPill tone="error">Hidden</StatusPill>}
                  </div>
                  <p className="text-[14px] text-[#5A6075]">
                    {r.authorName} · {when(r.createdAt)}
                  </p>
                  <p className="text-[15px] font-semibold text-[#11162B]">{r.title}</p>
                  <p className="whitespace-pre-wrap break-words text-[15px] text-[#5A6075]">{r.comment}</p>
                  {r.moderation && (
                    <p className="text-[13px] text-[#5A6075]">
                      Last action: {r.moderation.status === 'hidden' ? 'hidden' : 'restored'} by {r.moderation.by} on{' '}
                      {when(r.moderation.at)} — “{r.moderation.reason}”
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className={r.hidden ? btnOutline : btnDanger}
                  onClick={() => {
                    setNotice('');
                    setTarget(r);
                  }}
                >
                  <EyeOff className="h-4 w-4" />
                  {r.hidden ? 'Unhide' : 'Hide'}
                </button>
              </li>
            ))}
          </ul>
        )}
        {pagination && <Pager pagination={pagination} onPage={setPage} busy={loading} noun="review" />}
      </Card>

      {target && (
        <ReasonDialog
          title={target.hidden ? 'Unhide this review?' : 'Hide this review?'}
          description={
            target.hidden
              ? 'It will appear on the product page again.'
              : 'It will disappear from the product’s review list and review summary. You can restore it later.'
          }
          confirmLabel={target.hidden ? 'Unhide' : 'Hide review'}
          danger={!target.hidden}
          onSubmit={submit}
          onClose={() => setTarget(null)}
        />
      )}
    </div>
  );
}
