'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BadgeCheck, ImagePlus, Star, X } from 'lucide-react';

import { apiUrl } from '@/lib/api-url';
import { rememberReturnTo } from '@/lib/auth-redirect';

const TOKEN_KEY = 'ardenby_token';
const TITLE_MAX = 100;
const COMMENT_MAX = 2000;
const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

type Photo = { id: string; url: string };

type Review = {
  id: string;
  authorName: string;
  rating: number;
  date: string | null;
  title: string;
  comment: string;
  verified: boolean;
  variant: string | null;
  photos: Photo[];
};

type Summary = {
  average: number;
  count: number;
  distribution: Record<string, number>;
};

type Eligibility = {
  canReview: boolean;
  verifiedPurchase: boolean;
  alreadyReviewed: boolean;
  myReview: Review | null;
  photosEnabled: boolean;
};

const readToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const formatDate = (value: string | null) => {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const openSignIn = () => {
  rememberReturnTo(`${window.location.pathname}${window.location.search}#reviews`);
  window.dispatchEvent(new Event('ardenby-open-auth'));
};

/** Five stars, filled to `value` (supports fractions for the average). */
function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        return (
          <span key={n} className="relative inline-block" style={{ width: size, height: size }}>
            <Star width={size} height={size} className="absolute inset-0 text-[#D2D2D2]" strokeWidth={1.5} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star
                width={size}
                height={size}
                className="fill-[#E53935] text-[#E53935]"
                strokeWidth={1.5}
                style={{ maxWidth: 'none' }}
              />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function ProductReviews({
  slug,
  productName,
  productImage,
  variantLabel,
}: {
  slug: string;
  productName: string;
  productImage?: string;
  variantLabel?: string;
}) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [signedIn, setSignedIn] = useState(false);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'info' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const base = `/api/products/${encodeURIComponent(slug)}/reviews`;

  const load = useCallback(
    async (pageToLoad: number, append: boolean) => {
      try {
        const res = await fetch(apiUrl(`${base}?page=${pageToLoad}&limit=6`), { cache: 'no-store' });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) throw new Error(data?.message || 'Could not load reviews.');
        setSummary(data.summary);
        setReviews((prev) => {
          if (!append) return data.reviews;
          const seen = new Set(prev.map((r) => r.id));
          return [...prev, ...data.reviews.filter((r: Review) => !seen.has(r.id))];
        });
        setPage(data.page);
        setHasMore(Boolean(data.hasMore));
        setLoadError('');
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Could not load reviews.');
      }
    },
    [base]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load(1, false).finally(() => {
      if (cancelled) return;
      setLoading(false);
      // Arrived via a rating link (/product/x#reviews): the section only has its
      // final height once the reviews are in, so scroll after they load.
      if (window.location.hash === '#reviews') {
        window.requestAnimationFrame(() =>
          document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const loadEligibility = useCallback(async () => {
    const token = readToken();
    setSignedIn(Boolean(token));
    if (!token) {
      setEligibility(null);
      return;
    }
    try {
      const res = await fetch(apiUrl(`${base}/eligibility`), {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const data = await res.json().catch(() => null);
      setEligibility(res.ok && data?.success ? data : null);
    } catch {
      setEligibility(null);
    }
  }, [base]);

  useEffect(() => {
    loadEligibility();
    window.addEventListener('ardenby-auth-changed', loadEligibility);
    window.addEventListener('storage', loadEligibility);
    return () => {
      window.removeEventListener('ardenby-auth-changed', loadEligibility);
      window.removeEventListener('storage', loadEligibility);
    };
  }, [loadEligibility]);

  const refresh = () => Promise.all([load(1, false), loadEligibility()]);

  const openReviewForm = () => {
    setNotice(null);
    if (!readToken()) {
      openSignIn();
      return;
    }
    if (eligibility?.alreadyReviewed) {
      setFormMode('edit');
      return;
    }
    if (eligibility && !eligibility.canReview) {
      setNotice({
        tone: 'info',
        text: 'Only customers who have received this product can review it. You can write a review once your order is delivered.',
      });
      return;
    }
    setFormMode('create');
  };

  const onSaved = async (message: string) => {
    setFormMode(null);
    setNotice({ tone: 'ok', text: message });
    await refresh();
  };

  const deleteMine = async () => {
    const token = readToken();
    if (!token) return openSignIn();
    setDeleting(true);
    try {
      const res = await fetch(apiUrl(`${base}/me`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) throw new Error(data?.message || 'Could not delete your review.');
      setConfirmDelete(false);
      setNotice({ tone: 'ok', text: 'Your review has been deleted.' });
      await refresh();
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof Error ? error.message : 'Could not delete your review.' });
    } finally {
      setDeleting(false);
    }
  };

  const count = summary?.count ?? 0;
  const average = summary?.average ?? 0;
  const myId = eligibility?.myReview?.id ?? null;
  const buttonLabel = eligibility?.alreadyReviewed ? 'Edit your review' : 'Write a Review';

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="mx-auto mt-14 w-full max-w-[1500px] scroll-mt-[calc(var(--header-h,96px)+16px)] px-4 sm:px-6 lg:mt-[88px] lg:px-12"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--line)] pb-5">
        <div className="flex min-w-0 items-center gap-4">
          {productImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={productImage}
              alt={productName}
              className="h-16 w-14 shrink-0 bg-[#F5F5F5] object-cover object-center sm:h-20 sm:w-16"
            />
          )}
          <div className="min-w-0">
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#E53935]">Reviews</p>
            <h2 id="reviews-heading" className="mt-1 text-[26px] font-semibold uppercase tracking-[0.04em] text-[#111111] lg:text-[34px]">
              Customer Reviews
            </h2>
            <p className="mt-1 truncate text-[13px] text-[#5A5A5A]">
              {productName}
              {variantLabel ? <span className="text-[#828282]"> · Selected: {variantLabel}</span> : null}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openReviewForm}
          className="inline-flex min-h-[48px] items-center justify-center bg-[#111111] px-7 text-[13px] font-semibold uppercase tracking-[0.18em] text-[#FFFFFF] transition hover:bg-[#E53935]"
        >
          {buttonLabel}
        </button>
      </div>

      {notice && (
        <p
          role={notice.tone === 'error' ? 'alert' : 'status'}
          className={`mt-5 border-l-4 bg-[#F5F5F5] px-4 py-3 text-[14px] ${
            notice.tone === 'error' ? 'border-[#B3261E] text-[#B3261E]' : 'border-[#E53935] text-[#111111]'
          }`}
        >
          {notice.text}
        </p>
      )}

      {loading ? (
        <div className="mt-8 animate-pulse space-y-4" aria-busy="true">
          <div className="h-24 bg-[#F5F5F5]" />
          <div className="h-28 bg-[#F5F5F5]" />
        </div>
      ) : loadError && !summary ? (
        <div className="mt-8 bg-[#F5F5F5] px-6 py-10 text-center">
          <p className="text-[14px] text-[#5A5A5A]">{loadError}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              load(1, false).finally(() => setLoading(false));
            }}
            className="mt-4 border border-[#111111] px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#111111] hover:bg-[#111111] hover:text-[#FFFFFF]"
          >
            Try again
          </button>
        </div>
      ) : count === 0 ? (
        <div className="mt-8 bg-[#F5F5F5] px-6 py-14 text-center">
          <Star className="mx-auto h-8 w-8 text-[#E53935]" strokeWidth={1.4} />
          <h3 className="mt-4 text-[18px] font-semibold uppercase tracking-[0.06em] text-[#111111]">No reviews yet</h3>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-6 text-[#5A5A5A]">
            Customers who have received the {productName} can be the first to share how it fits and feels.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-14">
          <div className="bg-[#F5F5F5] p-6 lg:self-start">
            <div className="flex items-end gap-3">
              <span className="text-[56px] font-semibold leading-none text-[#111111]">{average.toFixed(1)}</span>
              <span className="pb-1 text-[14px] text-[#5A5A5A]">out of 5</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Stars value={average} size={18} />
              <span className="text-[13px] text-[#5A5A5A]">
                {count} {count === 1 ? 'review' : 'reviews'}
              </span>
            </div>
            <ul className="mt-6 space-y-2.5" aria-label="Rating distribution">
              {[5, 4, 3, 2, 1].map((stars) => {
                const n = summary?.distribution?.[String(stars)] ?? 0;
                const pct = count > 0 ? Math.round((n / count) * 100) : 0;
                return (
                  <li key={stars} className="flex items-center gap-3 text-[13px] text-[#111111]">
                    <span className="w-9 shrink-0">{stars} star</span>
                    <span className="h-2 flex-1 overflow-hidden bg-[#FFFFFF]">
                      <span className="block h-full bg-[#E53935]" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="w-8 shrink-0 text-right tabular-nums text-[#5A5A5A]">{n}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <ul className="divide-y divide-[var(--line-2)] border-y border-[var(--line-2)]">
              {reviews.map((review) => {
                const mine = review.id === myId;
                return (
                  <li key={review.id} className="py-6">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Stars value={review.rating} />
                      {review.verified && (
                        <span className="inline-flex items-center gap-1 bg-[#111111] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#FFFFFF]">
                          <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          Verified Purchase
                        </span>
                      )}
                      {mine && (
                        <span className="border border-[#111111] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#111111]">
                          Your review
                        </span>
                      )}
                    </div>
                    {review.title && (
                      <h3 className="mt-3 break-words text-[16px] font-semibold text-[#111111]">{review.title}</h3>
                    )}
                    {review.comment && (
                      <p className="mt-2 whitespace-pre-line break-words text-[14px] leading-[1.7] text-[#222222]">
                        {review.comment}
                      </p>
                    )}
                    {review.photos.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {review.photos.map((photo, index) => (
                          <li key={photo.id}>
                            <button
                              type="button"
                              onClick={() => setLightbox(photo.url)}
                              aria-label={`View customer photo ${index + 1}`}
                              className="block h-20 w-20 overflow-hidden bg-[#F5F5F5]"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={photo.url} alt="Customer photo" loading="lazy" className="h-full w-full object-cover" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-3 text-[12px] uppercase tracking-[0.1em] text-[#828282]">
                      <span className="font-semibold text-[#111111]">{review.authorName || 'KOVENIK Customer'}</span>
                      {formatDate(review.date) && <> · {formatDate(review.date)}</>}
                      {review.variant && <> · {review.variant}</>}
                    </p>
                    {mine && (
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.14em]">
                        {confirmDelete ? (
                          <>
                            <span className="normal-case tracking-normal text-[#111111]">Delete your review?</span>
                            <button
                              type="button"
                              disabled={deleting}
                              onClick={deleteMine}
                              className="bg-[#E53935] px-3 py-2 text-[#FFFFFF] disabled:opacity-60"
                            >
                              {deleting ? 'Deleting…' : 'Yes, delete'}
                            </button>
                            <button
                              type="button"
                              disabled={deleting}
                              onClick={() => setConfirmDelete(false)}
                              className="px-3 py-2 text-[#111111] underline"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => setFormMode('edit')} className="text-[#111111] underline underline-offset-4 hover:text-[#E53935]">
                              Edit
                            </button>
                            <button type="button" onClick={() => setConfirmDelete(true)} className="text-[#B3261E] underline underline-offset-4">
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {loadError && <p className="mt-4 text-[13px] text-[#B3261E]">{loadError}</p>}

            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={async () => {
                    setLoadingMore(true);
                    await load(page + 1, true);
                    setLoadingMore(false);
                  }}
                  className="border border-[#111111] px-7 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#111111] transition hover:bg-[#111111] hover:text-[#FFFFFF] disabled:opacity-50"
                >
                  {loadingMore ? 'Loading…' : 'Load more reviews'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {formMode && (
        <ReviewForm
          base={base}
          mode={formMode}
          initial={formMode === 'edit' ? eligibility?.myReview ?? null : null}
          productName={productName}
          productImage={productImage}
          variantLabel={variantLabel}
          verifiedPurchase={Boolean(signedIn && eligibility?.verifiedPurchase)}
          photosEnabled={Boolean(eligibility?.photosEnabled)}
          onClose={() => setFormMode(null)}
          onSaved={onSaved}
        />
      )}

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Customer photo"
          className="fixed inset-0 z-[130] flex items-center justify-center bg-[#111111]/85 p-4"
          onClick={() => setLightbox(null)}
        >
          <button type="button" aria-label="Close photo" className="absolute right-4 top-4 text-[#FFFFFF]" onClick={() => setLightbox(null)}>
            <X className="h-7 w-7" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Customer photo" className="max-h-[88vh] max-w-full object-contain" />
        </div>
      )}
    </section>
  );
}

function ReviewForm({
  base,
  mode,
  initial,
  productName,
  productImage,
  variantLabel,
  verifiedPurchase,
  photosEnabled,
  onClose,
  onSaved,
}: {
  base: string;
  mode: 'create' | 'edit';
  initial: Review | null;
  productName: string;
  productImage?: string;
  variantLabel?: string;
  verifiedPurchase: boolean;
  photosEnabled: boolean;
  onClose: () => void;
  onSaved: (message: string) => void | Promise<void>;
}) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [comment, setComment] = useState(initial?.comment ?? '');
  const [existing, setExisting] = useState<Photo[]>(initial?.photos ?? []);
  const [removed, setRemoved] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<{ file: File; preview: string }[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previewsRef = useRef<string[]>([]);

  useEffect(() => {
    previewsRef.current = newFiles.map((f) => f.preview);
  }, [newFiles]);
  useEffect(() => () => previewsRef.current.forEach((url) => URL.revokeObjectURL(url)), []);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector<HTMLElement>('button[data-star]')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitting]);

  const photoCount = existing.length + newFiles.length;

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const accepted: { file: File; preview: string }[] = [];
    let problem = '';
    for (const file of Array.from(list)) {
      if (!PHOTO_TYPES.includes(file.type)) {
        problem = 'Photos must be JPG, PNG, WEBP or AVIF images.';
      } else if (file.size > MAX_PHOTO_BYTES) {
        problem = 'Each photo must be 5 MB or smaller.';
      } else if (photoCount + accepted.length >= MAX_PHOTOS) {
        problem = `You can add up to ${MAX_PHOTOS} photos.`;
      } else {
        accepted.push({ file, preview: URL.createObjectURL(file) });
      }
    }
    setError(problem);
    if (accepted.length) setNewFiles((prev) => [...prev, ...accepted]);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const cleanTitle = title.trim();
    const cleanComment = comment.trim();
    if (rating < 1) return setError('Please choose a star rating.');
    if (cleanTitle.length < 3) return setError('Please add a title (at least 3 characters).');
    if (cleanComment.length < 10) return setError('Please write at least 10 characters in your review.');

    const token = readToken();
    if (!token) {
      setError('Your session has ended. Please sign in again.');
      return;
    }

    const form = new FormData();
    form.append('rating', String(rating));
    form.append('title', cleanTitle);
    form.append('comment', cleanComment);
    if (removed.length) form.append('removePhotos', JSON.stringify(removed));
    newFiles.forEach(({ file }) => form.append('photos', file));

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(apiUrl(mode === 'edit' ? `${base}/me` : base), {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        if (res.status === 401) openSignIn();
        throw new Error(data?.message || 'Could not submit your review. Please try again.');
      }
      await onSaved(data.message || (mode === 'edit' ? 'Your review has been updated.' : 'Thank you! Your review has been posted.'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your review. Please try again.');
      setSubmitting(false);
    }
  };

  const shown = hover || rating;
  const labels = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
  const inputClass =
    'w-full border border-[#D2D2D2] bg-[#FFFFFF] px-3.5 py-3 text-[15px] text-[#111111] outline-none transition focus:border-[#111111]';

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-[#111111]/60 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-form-title"
        className="max-h-[92vh] w-full overflow-y-auto bg-[#FFFFFF] p-6 sm:max-w-[560px] sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {productImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={productImage} alt={productName} className="h-16 w-12 shrink-0 bg-[#F5F5F5] object-cover" />
            )}
            <div className="min-w-0">
              <h3 id="review-form-title" className="text-[20px] font-semibold uppercase tracking-[0.04em] text-[#111111]">
                {mode === 'edit' ? 'Edit your review' : 'Write a Review'}
              </h3>
              <p className="mt-1 truncate text-[13px] text-[#5A5A5A]">
                {productName}
                {variantLabel ? ` · ${variantLabel}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close review form"
            className="p-1 text-[#111111] hover:text-[#E53935]"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
          <fieldset>
            <legend className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#111111]">Your rating</legend>
            <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  data-star
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  aria-pressed={rating === n}
                  onMouseEnter={() => setHover(n)}
                  onClick={() => setRating(n)}
                  className="p-1"
                >
                  <Star
                    className={`h-8 w-8 transition ${n <= shown ? 'fill-[#E53935] text-[#E53935]' : 'text-[#D2D2D2]'}`}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
              <span className="ml-2 text-[13px] text-[#5A5A5A]">{labels[shown]}</span>
            </div>
          </fieldset>

          <div>
            <label htmlFor="review-title" className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#111111]">
              Title
            </label>
            <input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={TITLE_MAX}
              placeholder="Sum it up in a few words"
              className={`${inputClass} mt-2`}
            />
          </div>

          <div>
            <label htmlFor="review-comment" className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#111111]">
              Review
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={COMMENT_MAX}
              rows={5}
              placeholder="How is the fit, fabric and quality?"
              className={`${inputClass} mt-2 resize-y`}
            />
            <p className="mt-1 text-right text-[12px] text-[#828282]">
              {comment.length}/{COMMENT_MAX}
            </p>
          </div>

          {photosEnabled && (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#111111]">
                Photos <span className="font-normal normal-case tracking-normal text-[#828282]">(optional, up to {MAX_PHOTOS})</span>
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {existing.map((photo) => (
                  <li key={photo.id} className="relative h-20 w-20 bg-[#F5F5F5]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt="Your photo" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      aria-label="Remove photo"
                      onClick={() => {
                        setExisting((prev) => prev.filter((p) => p.id !== photo.id));
                        setRemoved((prev) => [...prev, photo.id]);
                      }}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center bg-[#111111] text-[#FFFFFF]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
                {newFiles.map(({ preview }, index) => (
                  <li key={preview} className="relative h-20 w-20 bg-[#F5F5F5]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="Selected photo" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      aria-label="Remove photo"
                      onClick={() => {
                        URL.revokeObjectURL(preview);
                        setNewFiles((prev) => prev.filter((_, i) => i !== index));
                      }}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center bg-[#111111] text-[#FFFFFF]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
                {photoCount < MAX_PHOTOS && (
                  <li>
                    <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-[#828282] text-[11px] text-[#5A5A5A] hover:border-[#111111]">
                      <ImagePlus className="h-5 w-5" aria-hidden="true" />
                      Add
                      <input
                        type="file"
                        accept={PHOTO_TYPES.join(',')}
                        multiple
                        className="sr-only"
                        onChange={(e) => {
                          addFiles(e.target.files);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </li>
                )}
              </ul>
              <p className="mt-1 text-[12px] text-[#828282]">JPG, PNG, WEBP or AVIF, up to 5 MB each.</p>
            </div>
          )}

          {verifiedPurchase && (
            <p className="flex items-center gap-2 bg-[#F5F5F5] px-3 py-2 text-[13px] text-[#111111]">
              <BadgeCheck className="h-4 w-4 text-[#E53935]" aria-hidden="true" />
              Your delivered order was found. Your review shows a Verified Purchase badge.
            </p>
          )}

          {error && (
            <p role="alert" className="border-l-4 border-[#B3261E] bg-[#F5F5F5] px-3 py-2 text-[13px] text-[#B3261E]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="min-h-[50px] w-full bg-[#111111] text-[13px] font-semibold uppercase tracking-[0.18em] text-[#FFFFFF] transition hover:bg-[#E53935] disabled:opacity-60"
          >
            {submitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Submit review'}
          </button>
        </form>
      </div>
    </div>
  );
}
