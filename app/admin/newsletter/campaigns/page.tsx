'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Copy, Mail, Plus, RefreshCw } from 'lucide-react';

import { Pager } from '@/components/admin/pager';
import { CampaignStatusBadge } from '@/components/admin/newsletter/status-badge';
import { Card, EmptyState, Notice, PageHeader, Spinner, btnOutline, btnPrimary, fieldClass } from '@/components/admin/ui';
import { Pagination, message, when } from '@/lib/admin-ops-api';
import { STATUS_LABEL, newsletterApi, num } from '@/lib/newsletter-campaign-api';
import type { Campaign, CampaignStatus } from '@/lib/newsletter-campaign-api';

/** All campaigns: search, filter by status, open, duplicate. Admin and Super Admin; sending is done inside a campaign (Super Admin only). */
export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
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
      const data = await newsletterApi.listCampaigns({ page, limit: 15, status, search });
      if (request !== latest.current) return;
      setCampaigns(data.campaigns);
      setPagination(data.pagination);
    } catch (e) {
      if (request === latest.current) setError(message(e));
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const duplicate = async (id: string) => {
    setBusyId(id);
    setError('');
    try {
      const copy = await newsletterApi.duplicateCampaign(id);
      router.push(`/admin/newsletter/campaigns/${copy.id}`);
    } catch (e) {
      setError(message(e));
      setBusyId('');
    }
  };

  return (
    <div>
      <PageHeader
        title="Campaigns"
        subtitle="Create, edit and review newsletter campaigns. Only a Super Admin can choose recipients, schedule or send."
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

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          className={`${fieldClass} sm:max-w-xs`}
          placeholder="Search by name or subject"
          aria-label="Search campaigns"
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
          {(Object.keys(STATUS_LABEL) as CampaignStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <Notice tone="error" className="mb-4">
          {error}
        </Notice>
      )}

      <Card bodyClassName="p-0">
        {loading && campaigns.length === 0 ? (
          <Spinner label="Loading campaigns" />
        ) : campaigns.length === 0 ? (
          <EmptyState icon={Mail} title="No campaigns found">
            {status || search ? 'Try different filters.' : 'Create your first campaign to get started.'}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto" aria-busy={loading}>
            <table className="w-full min-w-[820px] text-left text-[14px]">
              <thead className="border-b border-[#E4E7EC] text-[12px] uppercase tracking-wide text-[#626875]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Campaign</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">When</th>
                  <th className="px-3 py-3 text-right font-semibold">Recipients</th>
                  <th className="px-3 py-3 text-right font-semibold">Sent</th>
                  <th className="px-3 py-3 text-right font-semibold">Failed</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC]">
                {campaigns.map((c) => (
                  <tr key={c.id} className="align-top">
                    <td className="max-w-[300px] px-5 py-3">
                      <Link href={`/admin/newsletter/campaigns/${c.id}`} className="block truncate font-semibold text-[#111111] hover:text-[#C62828]">
                        {c.name}
                      </Link>
                      <span className="block truncate text-[12px] text-[#626875]">{c.subject || 'No subject yet'}</span>
                    </td>
                    <td className="px-3 py-3">
                      <CampaignStatusBadge status={c.status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-[#344054]">
                      {c.status === 'scheduled'
                        ? when(c.scheduledAt)
                        : c.completedAt
                          ? when(c.completedAt)
                          : c.startedAt
                            ? when(c.startedAt)
                            : `Edited ${when(c.updatedAt)}`}
                    </td>
                    <td className="px-3 py-3 text-right text-[#344054]">{c.totalRecipients ? num(c.totalRecipients) : '—'}</td>
                    <td className="px-3 py-3 text-right text-[#344054]">{c.stats ? num(c.stats.sent) : '—'}</td>
                    <td className={`px-3 py-3 text-right ${c.stats && c.stats.failed > 0 ? 'font-semibold text-[#C62828]' : 'text-[#344054]'}`}>{c.stats ? num(c.stats.failed) : '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/newsletter/campaigns/${c.id}`} className={`${btnOutline} !min-h-0 !px-3 !py-1.5 !text-[13px]`}>
                          {c.status === 'draft' ? 'Edit' : 'View'}
                        </Link>
                        <button type="button" className={`${btnOutline} !min-h-0 !px-3 !py-1.5 !text-[13px]`} disabled={busyId === c.id} onClick={() => void duplicate(c.id)} aria-label={`Duplicate ${c.name}`}>
                          <Copy className="h-4 w-4" /> Duplicate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination && <Pager pagination={pagination} onPage={setPage} busy={loading} noun="campaign" />}
      </Card>
    </div>
  );
}
