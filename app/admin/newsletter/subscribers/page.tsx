'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Mail, RefreshCw, UserMinus } from 'lucide-react';

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
  btnDark,
  btnOutline,
  fieldClass,
} from '@/components/admin/ui';
import { Pagination, downloadCsv, message, opsRequest, toQuery, when } from '@/lib/admin-ops-api';

type Stats = { total: number; active: number; pending: number; unsubscribed: number };
type Subscriber = {
  id: string;
  email: string;
  status: 'pending' | 'active' | 'unsubscribed' | string;
  source: string;
  subscribedAt: string | null;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
};

const TONE = { active: 'success', pending: 'warning', unsubscribed: 'neutral' } as const;
const LABEL = { active: 'Active', pending: 'Pending', unsubscribed: 'Unsubscribed' } as const;

/** Newsletter subscribers: counts, search, status filter, dates, a CSV of confirmed subscribers and a manual
 *  Unsubscribe action. There is deliberately no way to subscribe or re-activate anyone from here: only the
 *  subscriber's own email confirmation does that. The backend decides who may use it (Admin and Super Admin). */
export default function AdminNewsletterPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<Subscriber | null>(null);
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
      const [s, list] = await Promise.all([
        opsRequest('/api/admin/newsletter/stats'),
        opsRequest(`/api/admin/newsletter/subscribers${toQuery({ page, limit: 25, status, search })}`),
      ]);
      if (request !== latest.current) return;
      setStats(s.stats || null);
      setSubscribers(list.subscribers || []);
      setPagination(list.pagination || null);
    } catch (e) {
      if (request === latest.current) setError(message(e));
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const exportCsv = async () => {
    setExporting(true);
    setError('');
    setNotice('');
    try {
      const name = await downloadCsv('/api/admin/newsletter/export.csv', 'kovenik-newsletter-subscribers.csv');
      setNotice(`Downloaded ${name}. It contains confirmed (active) subscribers only.`);
    } catch (e) {
      setError(message(e));
    } finally {
      setExporting(false);
    }
  };

  const submitUnsubscribe = async (reason: string) => {
    if (!target) return;
    const result = await opsRequest(`/api/admin/newsletter/subscribers/${encodeURIComponent(target.id)}/unsubscribe`, {
      method: 'POST',
      body: JSON.stringify({ confirm: true, reason }),
    });
    setNotice(typeof result?.message === 'string' ? result.message : 'Subscriber unsubscribed.');
    setTarget(null);
    await load();
  };

  const cards: { label: string; value: number | undefined; hint: string }[] = [
    { label: 'Total', value: stats?.total, hint: 'Everyone who signed up' },
    { label: 'Active', value: stats?.active, hint: 'Confirmed their email' },
    { label: 'Pending', value: stats?.pending, hint: 'Waiting to confirm' },
    { label: 'Unsubscribed', value: stats?.unsubscribed, hint: 'Opted out, never emailed' },
  ];

  return (
    <div>
      <PageHeader
        title="Newsletter"
        subtitle="People who joined the newsletter. Only confirmed (active) subscribers can receive marketing email; pending and unsubscribed addresses never do."
        actions={
          <>
            <button type="button" className={btnOutline} onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button type="button" className={btnDark} onClick={() => void exportCsv()} disabled={exporting}>
              <Download className="h-4 w-4" /> {exporting ? 'Preparing…' : 'Export active (CSV)'}
            </button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-[#E3E5EE] bg-white p-4 md:p-5">
            <p className="text-[14px] font-semibold text-[#5A6075]">{c.label}</p>
            <p className="mt-1 text-[30px] font-bold leading-tight text-[#11162B]" aria-busy={loading && !stats}>
              {c.value === undefined ? '—' : c.value.toLocaleString('en-IN')}
            </p>
            <p className="mt-0.5 text-[13px] text-[#5A6075]">{c.hint}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          className={`${fieldClass} sm:max-w-xs`}
          placeholder="Search by email"
          aria-label="Search subscribers by email"
          maxLength={100}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select
          className={`${fieldClass} sm:max-w-[200px]`}
          aria-label="Filter by status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="unsubscribed">Unsubscribed</option>
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
        {loading && subscribers.length === 0 ? (
          <Spinner label="Loading subscribers" />
        ) : subscribers.length === 0 ? (
          <EmptyState icon={Mail} title="No subscribers found">
            {status || search ? 'Try different filters.' : 'Subscribers appear here once visitors join and confirm.'}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto" aria-busy={loading}>
            <table className="w-full min-w-[760px] text-left text-[15px]">
              <thead className="border-b border-[#E3E5EE] text-[13px] uppercase tracking-wide text-[#5A6075]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Subscribed</th>
                  <th className="px-3 py-3 font-semibold">Confirmed</th>
                  <th className="px-3 py-3 font-semibold">Unsubscribed</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E5EE]">
                {subscribers.map((s) => {
                  const tone = TONE[s.status as keyof typeof TONE] ?? 'neutral';
                  const label = LABEL[s.status as keyof typeof LABEL] ?? s.status;
                  return (
                    <tr key={s.id}>
                      <td className="max-w-[280px] break-all px-5 py-3 font-medium text-[#11162B]">{s.email}</td>
                      <td className="px-3 py-3">
                        <StatusPill tone={tone}>{label}</StatusPill>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-[#5A6075]">{when(s.subscribedAt)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-[#5A6075]">{when(s.confirmedAt)}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-[#5A6075]">{when(s.unsubscribedAt)}</td>
                      <td className="px-5 py-3 text-right">
                        {s.status === 'active' || s.status === 'pending' ? (
                          <button
                            type="button"
                            className={`${btnDanger} !min-h-0 !px-3 !py-1.5 !text-[14px]`}
                            onClick={() => {
                              setNotice('');
                              setTarget(s);
                            }}
                          >
                            <UserMinus className="h-4 w-4" /> Unsubscribe
                          </button>
                        ) : (
                          <span className="text-[14px] text-[#5A6075]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {pagination && <Pager pagination={pagination} onPage={setPage} busy={loading} noun="subscriber" />}
      </Card>

      {target && (
        <ReasonDialog
          danger
          title="Unsubscribe this subscriber?"
          confirmLabel="Yes, unsubscribe"
          reasonLabel="Reason (saved in the audit log)"
          description={
            <>
              <strong className="break-all text-[#11162B]">{target.email}</strong> will stop receiving newsletter email
              immediately. This cannot be undone from here: they would have to sign up and confirm their email again.
            </>
          }
          onSubmit={submitUnsubscribe}
          onClose={() => setTarget(null)}
        />
      )}
    </div>
  );
}
