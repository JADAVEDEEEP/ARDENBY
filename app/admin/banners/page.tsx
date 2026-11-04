'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, ImageIcon, Loader2, Pencil, Plus, Power, Trash2 } from 'lucide-react';

import { BannerFormDialog } from '@/components/admin/banner-form-dialog';
import {
  Card,
  EmptyState,
  Notice,
  PageHeader,
  Spinner,
  StatusPill,
  btnDanger,
  btnOutline,
  btnPrimary,
} from '@/components/admin/ui';
import { message, opsRequest, when } from '@/lib/admin-ops-api';
import type { AdminBanner, BannerStatus } from '@/lib/banner-api';

const STATUS: Record<BannerStatus, { label: string; tone: 'success' | 'warning' | 'error' | 'neutral' }> = {
  live: { label: 'Live', tone: 'success' },
  scheduled: { label: 'Scheduled', tone: 'warning' },
  expired: { label: 'Expired', tone: 'error' },
  inactive: { label: 'Inactive', tone: 'neutral' },
};

const schedule = (b: AdminBanner) => {
  if (!b.startAt && !b.endAt) return 'Always (no dates set)';
  return `${b.startAt ? when(b.startAt) : 'Now'}  →  ${b.endAt ? when(b.endAt) : 'No end'}`;
};

/** Homepage hero banners: create, schedule, order, activate and delete. */
export default function AdminBannersPage() {
  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState<{ banner: AdminBanner | null } | null>(null);
  const [deleting, setDeleting] = useState<AdminBanner | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await opsRequest<{ banners?: AdminBanner[] }>('/api/admin/banners');
      setBanners(Array.isArray(data.banners) ? data.banners : []);
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (banner: AdminBanner) => {
    setBusyId(banner.id);
    setNotice('');
    setError('');
    try {
      const result = await opsRequest<{ message?: string }>(`/api/admin/banners/${banner.id}/active`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !banner.active }),
      });
      setNotice(result.message || 'Banner updated.');
      await load();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusyId(null);
    }
  };

  // Renumbers the list 0..n after moving one row, saving only rows whose number changed.
  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= banners.length) return;

    const reordered = [...banners];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    setBusyId(banners[index].id);
    setNotice('');
    setError('');
    try {
      for (let i = 0; i < reordered.length; i += 1) {
        if (reordered[i].sortOrder === i) continue;
        const body = new FormData();
        body.set('sortOrder', String(i));
        await opsRequest(`/api/admin/banners/${reordered[i].id}`, { method: 'PUT', body });
      }
      setNotice('Display order updated.');
    } catch (e) {
      setError(message(e));
    } finally {
      setBusyId(null);
      await load();
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusyId(deleting.id);
    setError('');
    try {
      const result = await opsRequest<{ message?: string }>(`/api/admin/banners/${deleting.id}`, { method: 'DELETE' });
      setNotice(result.message || 'Banner deleted.');
      setDeleting(null);
      await load();
    } catch (e) {
      setError(message(e));
      setDeleting(null);
    } finally {
      setBusyId(null);
    }
  };

  const nextOrder = banners.length ? Math.max(...banners.map((b) => b.sortOrder)) + 1 : 0;

  return (
    <div>
      <PageHeader
        title="Banners"
        subtitle="Promotional banners in the homepage hero slider. Only active banners inside their dates are shown, in display order."
        actions={
          <button type="button" className={btnPrimary} onClick={() => setForm({ banner: null })}>
            <Plus className="h-4 w-4" />
            New banner
          </button>
        }
      />

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
        {loading ? (
          <Spinner label="Loading banners" />
        ) : banners.length === 0 ? (
          <EmptyState icon={ImageIcon} title="No banners yet">
            Create a banner to start the homepage slider. Without any, the homepage shows its standard hero image.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-[#E4E7EC]">
            {banners.map((banner, index) => {
              const status = STATUS[banner.status];
              const busy = busyId === banner.id;
              return (
                <li key={banner.id} className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:p-5">
                  <div className="flex shrink-0 items-start gap-4">
                    <div className="flex shrink-0 flex-col items-center gap-1">
                      <button
                        type="button"
                        aria-label={`Move ${banner.name} up`}
                        disabled={index === 0 || busyId !== null}
                        onClick={() => void move(index, -1)}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-[#E4E7EC] text-[#626875] hover:border-[#111111] hover:text-[#111111] disabled:opacity-40"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <span className="text-[12px] font-semibold text-[#626875]" title="Display order">
                        {banner.sortOrder}
                      </span>
                      <button
                        type="button"
                        aria-label={`Move ${banner.name} down`}
                        disabled={index === banners.length - 1 || busyId !== null}
                        onClick={() => void move(index, 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-[#E4E7EC] text-[#626875] hover:border-[#111111] hover:text-[#111111] disabled:opacity-40"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={banner.imageUrl}
                      alt={banner.name}
                      loading="lazy"
                      className="aspect-[9/7] w-32 shrink-0 rounded-lg border border-[#E4E7EC] bg-[#F5F6F8] object-cover sm:w-44"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-[16px] font-bold text-[#111111]">{banner.name}</h2>
                      <StatusPill tone={status.tone}>{status.label}</StatusPill>
                      {banner.mobileImageUrl && <StatusPill tone="neutral">Mobile image</StatusPill>}
                    </div>
                    <p className="mt-1 text-[13px] text-[#626875]">{schedule(banner)}</p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-[13px] text-[#626875]">
                      {banner.linkUrl ? (
                        <>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{banner.linkUrl}</span>
                        </>
                      ) : (
                        'No destination link'
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:shrink-0 lg:justify-end">
                    <button type="button" className={btnOutline} onClick={() => void toggle(banner)} disabled={busy || busyId !== null}>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                      {banner.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button type="button" className={btnOutline} onClick={() => setForm({ banner })} disabled={busyId !== null}>
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button type="button" className={btnDanger} onClick={() => setDeleting(banner)} disabled={busyId !== null}>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {form && (
        <BannerFormDialog
          banner={form.banner}
          nextOrder={nextOrder}
          onClose={() => setForm(null)}
          onSaved={(text) => {
            setForm(null);
            setNotice(text);
            void load();
          }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => busyId === null && setDeleting(null)} />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="banner-delete-title"
            className="relative w-full max-w-md rounded-xl border border-[#E4E7EC] bg-white p-6 shadow-xl"
          >
            <h2 id="banner-delete-title" className="text-[20px] font-bold text-[#111111]">
              Delete this banner?
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-[#626875]">
              &ldquo;{deleting.name}&rdquo; and its uploaded images will be removed. This cannot be undone. To hide it
              temporarily, deactivate it instead.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" className={btnOutline} onClick={() => setDeleting(null)} disabled={busyId !== null}>
                Cancel
              </button>
              <button type="button" className={btnDanger} onClick={() => void confirmDelete()} disabled={busyId !== null}>
                {busyId && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete banner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
