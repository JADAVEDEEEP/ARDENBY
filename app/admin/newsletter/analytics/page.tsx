'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Pager } from '@/components/admin/pager';
import { CampaignStatusBadge } from '@/components/admin/newsletter/status-badge';
import { Card, EmptyState, Notice, PageHeader, Spinner, btnOutline, fieldClass } from '@/components/admin/ui';
import { Pagination, message, when } from '@/lib/admin-ops-api';
import { STATUS_LABEL, formatDuration, newsletterApi, num, pct } from '@/lib/newsletter-campaign-api';
import type { Campaign, CampaignStatus, Overview } from '@/lib/newsletter-campaign-api';

/**
 * Campaign analytics: only facts the system really has. Sent / failed / queued come from our own delivery records;
 * delivered and bounced come from Brevo's webhook and show a dash until it reports; unsubscribes are counted from
 * the unsubscribe link in each email. There are no open or click figures because SMTP cannot provide reliable ones.
 * Admin and Super Admin see the same aggregate numbers; per-recipient detail (with email addresses) is on each
 * campaign's Results tab for a Super Admin.
 */
export default function CampaignAnalyticsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const latest = useRef(0);

  const load = useCallback(async () => {
    const request = ++latest.current;
    setLoading(true);
    setError('');
    try {
      const [list, over] = await Promise.all([newsletterApi.listCampaigns({ page, limit: 12, status }), newsletterApi.overview()]);
      if (request !== latest.current) return;
      setCampaigns(list.campaigns);
      setPagination(list.pagination);
      setOverview(over);
    } catch (e) {
      if (request === latest.current) setError(message(e));
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Campaign analytics"
        subtitle="Delivery results per campaign. Figures that depend on Brevo's webhook show a dash until Brevo reports them."
        actions={
          <button type="button" className={btnOutline} onClick={() => void load()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      {error && <Notice tone="error" className="mb-4">{error}</Notice>}

      {overview && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Emails queued', num(overview.emails.queued)],
            ['Emails sent', num(overview.emails.sent)],
            ['Delivered', overview.providerData ? num(overview.emails.delivered) : '—'],
            ['Failed', num(overview.emails.failed)],
            ['Bounced', overview.providerData ? num(overview.emails.bounced) : '—'],
            ['Unsubscribed', num(overview.emails.unsubscribed)],
            [overview.providerData ? 'Delivery rate' : 'Acceptance rate', pct(overview.providerData ? overview.rates.delivery : overview.rates.acceptance)],
            ['Unsubscribe rate', pct(overview.rates.unsubscribe)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[#E4E7EC] bg-white p-4">
              <p className="text-[13px] font-semibold text-[#626875]">{label}</p>
              <p className="mt-1 text-[26px] font-bold leading-tight text-[#111111]">{value}</p>
            </div>
          ))}
        </div>
      )}

      {overview && !overview.providerData && (
        <Notice tone="info" className="mb-6">
          No delivery data from Brevo yet, so delivered, bounced and delivery-rate figures are not shown. To enable them, add the webhook described in the
          campaign setup guide (docs/NEWSLETTER_CAMPAIGNS.md). Until then the &ldquo;acceptance rate&rdquo; (accepted by the mail server) is shown instead.
        </Notice>
      )}

      {overview && overview.performance.length > 0 && (
        <Card title="Recent campaigns" description="Sent, failed and unsubscribed emails" className="mb-6">
          <div className="h-[280px]" role="img" aria-label="Bar chart comparing recent campaigns">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.performance.map((p) => ({ ...p, name: p.name.length > 14 ? `${p.name.slice(0, 13)}…` : p.name }))} margin={{ left: -10, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EC" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#626875' }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#626875' }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(17,17,17,0.04)' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="sent" name="Sent" fill="#111111" radius={[3, 3, 0, 0]} />
                <Bar dataKey="failed" name="Failed" fill="#C62828" radius={[3, 3, 0, 0]} />
                <Bar dataKey="unsubscribed" name="Unsubscribed" fill="#98A2B3" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="mb-4">
        <select className={`${fieldClass} sm:max-w-[220px]`} aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {(Object.keys(STATUS_LABEL) as CampaignStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>

      <Card bodyClassName="p-0">
        {loading && campaigns.length === 0 ? (
          <Spinner label="Loading analytics" />
        ) : campaigns.length === 0 ? (
          <EmptyState icon={BarChart3} title="No campaigns found">Results appear here once a campaign has been sent.</EmptyState>
        ) : (
          <div className="overflow-x-auto" aria-busy={loading}>
            <table className="w-full min-w-[1000px] text-left text-[14px]">
              <thead className="border-b border-[#E4E7EC] text-[12px] uppercase tracking-wide text-[#626875]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Campaign</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 text-right font-semibold">Queued</th>
                  <th className="px-3 py-3 text-right font-semibold">Sent</th>
                  <th className="px-3 py-3 text-right font-semibold">Delivered</th>
                  <th className="px-3 py-3 text-right font-semibold">Failed</th>
                  <th className="px-3 py-3 text-right font-semibold">Bounced</th>
                  <th className="px-3 py-3 text-right font-semibold">Unsub.</th>
                  <th className="px-3 py-3 text-right font-semibold">Delivery</th>
                  <th className="px-5 py-3 text-right font-semibold">Took</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC]">
                {campaigns.map((c) => {
                  const s = c.stats;
                  const started = Boolean(s && s.queued > 0);
                  return (
                    <tr key={c.id}>
                      <td className="max-w-[260px] px-5 py-3">
                        <Link href={`/admin/newsletter/campaigns/${c.id}`} className="block truncate font-semibold text-[#111111] hover:text-[#C62828]">{c.name}</Link>
                        <span className="block text-[12px] text-[#626875]">{c.completedAt ? when(c.completedAt) : c.scheduledAt ? `Scheduled ${when(c.scheduledAt)}` : when(c.updatedAt)}</span>
                      </td>
                      <td className="px-3 py-3"><CampaignStatusBadge status={c.status} /></td>
                      <td className="px-3 py-3 text-right text-[#344054]">{started ? num(s!.queued) : '—'}</td>
                      <td className="px-3 py-3 text-right text-[#344054]">{started ? num(s!.sent) : '—'}</td>
                      <td className="px-3 py-3 text-right text-[#344054]">{started ? num(s!.delivered) : '—'}</td>
                      <td className={`px-3 py-3 text-right ${started && s!.failed > 0 ? 'font-semibold text-[#C62828]' : 'text-[#344054]'}`}>{started ? num(s!.failed) : '—'}</td>
                      <td className="px-3 py-3 text-right text-[#344054]">{started ? num(s!.bounced) : '—'}</td>
                      <td className="px-3 py-3 text-right text-[#344054]">{started ? num(s!.unsubscribed) : '—'}</td>
                      <td className="px-3 py-3 text-right text-[#344054]">{started ? pct(s!.providerData ? s!.deliveryRate : s!.acceptanceRate) : '—'}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-right text-[#344054]">{started ? formatDuration(s!.completionSeconds) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {pagination && <Pager pagination={pagination} onPage={setPage} busy={loading} noun="campaign" />}
      </Card>
      <p className="mt-3 text-[12px] text-[#626875]">&ldquo;Delivery&rdquo; is delivered ÷ sent when Brevo has reported delivery data, otherwise the share accepted by the mail server.</p>
    </div>
  );
}
