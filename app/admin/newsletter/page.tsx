'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Mail, Plus, RefreshCw, Send } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { CampaignStatusBadge } from '@/components/admin/newsletter/status-badge';
import { Card, EmptyState, Notice, PageHeader, Spinner, btnOutline, btnPrimary } from '@/components/admin/ui';
import { message, when } from '@/lib/admin-ops-api';
import { newsletterApi, num, pct } from '@/lib/newsletter-campaign-api';
import type { Overview } from '@/lib/newsletter-campaign-api';

function Metric({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'red' }) {
  return (
    <div className="rounded-2xl border border-[#E4E7EC] bg-white p-4 md:p-5">
      <p className="text-[13px] font-semibold text-[#626875]">{label}</p>
      <p className={`mt-1 text-[28px] font-bold leading-tight ${tone === 'red' ? 'text-[#C62828]' : 'text-[#111111]'}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[12px] leading-snug text-[#626875]">{hint}</p>}
    </div>
  );
}

/** Newsletter overview: subscriber and campaign totals, delivery results and recent activity. Both Admin and Super Admin. */
export default function NewsletterOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await newsletterApi.overview());
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const noProvider = data && !data.providerData;
  const providerHint = 'Needs the Brevo delivery webhook. Not guessed.';

  return (
    <div>
      <PageHeader
        title="Newsletter"
        subtitle="Subscribers, campaigns and how your emails performed. Only confirmed (active) subscribers are ever emailed."
        actions={
          <>
            <button type="button" className={btnOutline} onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <Link href="/admin/newsletter/campaigns/new" className={btnPrimary}>
              <Plus className="h-4 w-4" /> New campaign
            </Link>
          </>
        }
      />

      {error && (
        <Notice tone="error" className="mb-4">
          {error}
        </Notice>
      )}

      {loading && !data ? (
        <Spinner label="Loading the newsletter overview" />
      ) : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            <Metric label="Total subscribers" value={num(data.subscribers.total)} hint="Everyone who signed up" />
            <Metric label="Active subscribers" value={num(data.subscribers.active)} hint="Confirmed, can be emailed" />
            <Metric label="Total campaigns" value={num(data.campaigns.total)} />
            <Metric label="Draft campaigns" value={num(data.campaigns.draft)} />
            <Metric label="Scheduled campaigns" value={num(data.campaigns.scheduled)} hint={data.campaigns.sending ? `${data.campaigns.sending} sending now` : undefined} />
            <Metric label="Sent campaigns" value={num(data.campaigns.sent)} />
            <Metric label="Failed emails" value={num(data.emails.failed)} tone={data.emails.failed > 0 ? 'red' : undefined} hint="Could not be handed to the mail server" />
            <Metric
              label="Delivery rate"
              value={pct(data.rates.delivery)}
              hint={noProvider ? providerHint : `${num(data.emails.delivered)} of ${num(data.emails.sent)} sent`}
            />
            <Metric
              label="Bounce rate"
              value={pct(data.rates.bounce)}
              hint={noProvider ? providerHint : `${num(data.emails.bounced)} bounced`}
            />
            <Metric label="Unsubscribe rate" value={pct(data.rates.unsubscribe)} hint={`${num(data.emails.unsubscribed)} unsubscribed from campaign emails`} />
          </div>

          {noProvider && (
            <Notice tone="info">
              Delivery and bounce figures come from Brevo&apos;s webhook. Until it is connected they show &ldquo;—&rdquo; instead of a guess. The mail-server
              acceptance rate so far is <strong>{pct(data.rates.acceptance)}</strong>. Open and click tracking is not available over SMTP, so it is not shown.
            </Notice>
          )}

          <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Card title="Campaign performance" description="Emails per campaign, last 10 campaigns that started">
              {data.performance.length === 0 ? (
                <EmptyState icon={Send} title="No campaigns sent yet">
                  Results appear here after your first campaign goes out.
                </EmptyState>
              ) : (
                <div className="h-[300px]" role="img" aria-label="Bar chart of emails sent, failed and unsubscribed per campaign">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.performance.map((p) => ({ ...p, name: p.name.length > 14 ? `${p.name.slice(0, 13)}…` : p.name }))} margin={{ left: -10, right: 8, top: 8 }}>
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
              )}
            </Card>

            <Card title="Recent activity" bodyClassName="p-0" action={<Link href="/admin/newsletter/campaigns" className="text-[13px] font-semibold text-[#C62828] hover:underline">All campaigns</Link>}>
              {data.recent.length === 0 ? (
                <EmptyState icon={Mail} title="No campaigns yet">
                  Create your first campaign to see it here.
                </EmptyState>
              ) : (
                <ul className="divide-y divide-[#E4E7EC]">
                  {data.recent.map((c) => (
                    <li key={c.id}>
                      <Link href={`/admin/newsletter/campaigns/${c.id}`} className="flex items-start justify-between gap-3 px-5 py-3 hover:bg-[#F9FAFB]">
                        <span className="min-w-0">
                          <span className="block truncate text-[14px] font-semibold text-[#111111]">{c.name}</span>
                          <span className="block text-[12px] text-[#626875]">
                            {c.status === 'scheduled' ? `Scheduled ${when(c.scheduledAt)}` : c.completedAt ? `Finished ${when(c.completedAt)}` : `Updated ${when(c.updatedAt)}`}
                            {c.stats && c.stats.queued > 0 ? ` · ${num(c.stats.sent)}/${num(c.stats.queued)} sent` : ''}
                          </span>
                        </span>
                        <CampaignStatusBadge status={c.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
