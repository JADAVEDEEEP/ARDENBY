'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

import { errorMessage, superAdminRequest } from '@/lib/superadmin-api';
import { cn } from '@/lib/utils';

type Entry = {
  id: string;
  createdAt: string;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  outcome: 'success' | 'failure';
  reason: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip: string | null;
};

type Response = {
  logs: Entry[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

const card = 'rounded-xl border border-[#E53935]/20 bg-gradient-to-b from-[#1A1A1A] to-[#111111]';
const field =
  'h-10 rounded-lg border border-[#E53935]/25 bg-[#1A1A1A]/80 px-3 text-sm text-[#F7F7F7] outline-none transition focus:border-[#E53935]/70';

const ACTIONS = [
  'user.role_change',
  'user.activate',
  'user.deactivate',
  'admin.invite',
  'security.sign_out_everywhere',
  'product.create',
  'product.update',
  'product.delete',
  'category.create',
  'category.update',
  'category.delete',
  'coupon.create',
  'coupon.update',
  'coupon.delete',
  'order.status_change',
  'order.cancel',
  'order.refund_retry',
  'review.hide',
  'review.unhide',
  'return.request',
  'return.approve',
  'return.reject',
  'return.receive',
  'return.refund',
  'return.refund_retry',
  'return.manual_refund_confirmed',
  'settings.update',
  'export.orders',
  'export.sales_summary',
];

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const pretty = (value: Record<string, unknown> | null) =>
  value && Object.keys(value).length ? JSON.stringify(value, null, 2) : '—';

/** Read-only trail of sensitive admin actions. There is no edit or delete anywhere. */
export default function AuditLogPage() {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [outcome, setOutcome] = useState('');
  const [actorInput, setActorInput] = useState('');
  const [actor, setActor] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const latest = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setActor(actorInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [actorInput]);

  const load = useCallback(async () => {
    const request = ++latest.current;
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({ page: String(page), limit: '25' });
      if (action) qs.set('action', action);
      if (outcome) qs.set('outcome', outcome);
      if (actor) qs.set('actor', actor);
      if (from) qs.set('from', from);
      if (to) qs.set('to', to);
      const response = await superAdminRequest<Response & { success: boolean }>(`/audit-logs?${qs}`);
      if (request === latest.current) setData(response);
    } catch (e) {
      if (request === latest.current) setError(errorMessage(e));
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, [page, action, outcome, actor, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const reset = (setter: (v: string) => void) => (e: { target: { value: string } }) => {
    setter(e.target.value);
    setPage(1);
  };

  const totalPages = data?.pagination.totalPages ?? 1;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl text-[#F7F7F7]">Audit log</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#979797]">
          Who did what, and when. Entries can only be added, never edited or deleted from this application. Passwords and
          tokens are never written here.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select className={field} value={action} onChange={reset(setAction)} aria-label="Filter by action">
          <option value="">Every action</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select className={field} value={outcome} onChange={reset(setOutcome)} aria-label="Filter by outcome">
          <option value="">Any outcome</option>
          <option value="success">Succeeded</option>
          <option value="failure">Failed</option>
        </select>
        <input
          className={cn(field, 'min-w-[200px] placeholder:text-[#7A7A7A]')}
          placeholder="Person (e-mail)"
          aria-label="Filter by person"
          value={actorInput}
          onChange={(e) => setActorInput(e.target.value)}
        />
        <input type="date" className={field} value={from} onChange={reset(setFrom)} aria-label="From date" />
        <input type="date" className={field} value={to} onChange={reset(setTo)} aria-label="To date" />
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#E53935]/30 px-3 text-xs font-semibold text-[#E5E5E5] transition hover:bg-[#272727] disabled:opacity-60"
        >
          <RefreshCw className={cn('h-4 w-4 text-[#E53935]', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-[#D98B7E]/40 bg-[#D98B7E]/10 px-4 py-2.5 text-sm text-[#E2A79D]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <section className={cn(card, 'overflow-hidden')} aria-busy={loading}>
        {!data && loading ? (
          <div className="space-y-px">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse bg-[#1A1A1A]" />
            ))}
          </div>
        ) : !data || data.logs.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-[#7A7A7A]">
            No entries match. If this is empty on a fresh install, the audit database update may not be applied yet.
          </p>
        ) : (
          <div className={cn('overflow-x-auto', loading && 'opacity-60')}>
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#E53935]/20 text-[10px] uppercase tracking-[0.18em] text-[#7A7A7A]">
                  <th className="px-5 py-3 font-semibold">When</th>
                  <th className="px-3 py-3 font-semibold">Who</th>
                  <th className="px-3 py-3 font-semibold">Action</th>
                  <th className="px-3 py-3 font-semibold">Item</th>
                  <th className="px-3 py-3 font-semibold">Result</th>
                  <th className="px-5 py-3 text-right font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {data.logs.map((entry) => (
                  <Fragment key={entry.id}>
                    <tr className="border-b border-[#E53935]/10">
                      <td className="whitespace-nowrap px-5 py-3 text-[#BBBBBB]">{when(entry.createdAt)}</td>
                      <td className="px-3 py-3">
                        <p className="text-[#F7F7F7]">{entry.actorEmail || 'System'}</p>
                        <p className="text-xs text-[#7A7A7A]">{entry.actorRole || ''}</p>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-[#E5E5E5]">{entry.action}</td>
                      <td className="max-w-[200px] truncate px-3 py-3 text-xs text-[#979797]" title={entry.resourceId || ''}>
                        {entry.resourceType}
                        {entry.resourceId ? ` · ${entry.resourceId}` : ''}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            'rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
                            entry.outcome === 'success'
                              ? 'border-[#7FAF7F]/40 text-[#9BC49B]'
                              : 'border-[#D98B7E]/50 text-[#E2A79D]'
                          )}
                        >
                          {entry.outcome === 'success' ? 'Done' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          className="text-xs font-semibold text-[#E53935] hover:underline"
                          onClick={() => setOpen(open === entry.id ? null : entry.id)}
                          aria-expanded={open === entry.id}
                        >
                          {open === entry.id ? 'Hide' : 'Show'}
                        </button>
                      </td>
                    </tr>
                    {open === entry.id && (
                      <tr className="border-b border-[#E53935]/10 bg-[#0F0F0F]">
                        <td colSpan={6} className="space-y-3 px-5 py-4 text-xs text-[#BBBBBB]">
                          {entry.reason && (
                            <p>
                              <span className="font-semibold text-[#F7F7F7]">Reason: </span>
                              {entry.reason}
                            </p>
                          )}
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="mb-1 font-semibold text-[#F7F7F7]">Before</p>
                              <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-[#1A1A1A] p-3">{pretty(entry.before)}</pre>
                            </div>
                            <div>
                              <p className="mb-1 font-semibold text-[#F7F7F7]">After</p>
                              <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-[#1A1A1A] p-3">{pretty(entry.after)}</pre>
                            </div>
                          </div>
                          {entry.ip && <p className="text-[#7A7A7A]">From address {entry.ip}</p>}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.pagination.total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E53935]/20 px-5 py-3 text-xs text-[#979797]">
            <span>
              Page {data.pagination.page} of {totalPages} · {data.pagination.total} entr
              {data.pagination.total === 1 ? 'y' : 'ies'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1 || loading}
                aria-label="Previous page"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#E53935]/30 transition hover:bg-[#272727] disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages || loading}
                aria-label="Next page"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#E53935]/30 transition hover:bg-[#272727] disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
