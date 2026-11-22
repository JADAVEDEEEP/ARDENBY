'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { History, RefreshCw } from 'lucide-react';

import { Pager } from '@/components/admin/pager';
import { Card, EmptyState, Notice, PageHeader, Spinner, btnOutline, fieldClass } from '@/components/admin/ui';
import { Pagination, message, opsRequest, toQuery, when } from '@/lib/admin-ops-api';

type Movement = {
  id: string;
  createdAt: string;
  productName: string | null;
  productId: string;
  variant: string | null;
  previousQuantity: number;
  newQuantity: number;
  change: number;
  reason: string;
  source: string;
  referenceType: string | null;
  referenceId: string | null;
  actor: string;
};

const SOURCES: [string, string][] = [
  ['admin_edit', 'Edited by admin'],
  ['initial_stock', 'Opening stock'],
  ['order_placed', 'Order placed'],
  ['order_paid', 'Online payment confirmed'],
  ['order_cancelled', 'Order cancelled'],
  ['return_received', 'Return received'],
];

/** Every stock change with before, after, why and who. Read only. */
export default function InventoryHistoryPage() {
  const [rows, setRows] = useState<Movement[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [source, setSource] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
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
      const data = await opsRequest(
        `/api/admin/inventory/movements${toQuery({ page, limit: 25, source, from, to, search })}`
      );
      if (request !== latest.current) return;
      setRows(data.movements || []);
      setPagination(data.pagination || null);
    } catch (e) {
      if (request === latest.current) setError(message(e));
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, [page, source, from, to, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const reset = (setter: (v: string) => void) => (e: { target: { value: string } }) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Stock history"
        subtitle="Every change to stock: what it was, what it became, why, and who or what caused it."
        actions={
          <>
            <Link href="/admin/inventory" className={btnOutline}>
              Back to inventory
            </Link>
            <button type="button" className={btnOutline} onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          className={`${fieldClass} sm:max-w-xs`}
          placeholder="Search product name"
          aria-label="Search by product"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select className={`${fieldClass} sm:max-w-[220px]`} aria-label="Filter by cause" value={source} onChange={reset(setSource)}>
          <option value="">Every cause</option>
          {SOURCES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input type="date" className={`${fieldClass} sm:max-w-[170px]`} aria-label="From date" value={from} onChange={reset(setFrom)} />
        <input type="date" className={`${fieldClass} sm:max-w-[170px]`} aria-label="To date" value={to} onChange={reset(setTo)} />
      </div>

      {error && (
        <Notice tone="error" className="mb-4">
          {error}
        </Notice>
      )}

      <Card bodyClassName="p-0">
        {loading && rows.length === 0 ? (
          <Spinner label="Loading history" />
        ) : rows.length === 0 ? (
          <EmptyState icon={History} title="No stock changes recorded">
            History starts from the moment this feature was switched on; earlier changes were not recorded.
          </EmptyState>
        ) : (
          <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[820px] text-left text-[15px]">
              <thead>
                <tr className="border-b border-[#E3E5EE] text-[13px] uppercase tracking-wider text-[#5A6075]">
                  <th className="px-5 py-3 font-semibold">When</th>
                  <th className="px-3 py-3 font-semibold">Product</th>
                  <th className="px-3 py-3 text-right font-semibold">Was</th>
                  <th className="px-3 py-3 text-right font-semibold">Change</th>
                  <th className="px-3 py-3 text-right font-semibold">Now</th>
                  <th className="px-3 py-3 font-semibold">Why</th>
                  <th className="px-5 py-3 font-semibold">By</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id} className="border-b border-[#E3E5EE] last:border-0">
                    <td className="whitespace-nowrap px-5 py-3 text-[#5A6075]">{when(m.createdAt)}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-[#11162B]">{m.productName || m.productId}</p>
                      {m.variant && <p className="text-[13px] text-[#5A6075]">{m.variant}</p>}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{m.previousQuantity}</td>
                    <td
                      className={`px-3 py-3 text-right font-bold tabular-nums ${
                        m.change < 0 ? 'text-[#9A2C1F]' : 'text-[#17603F]'
                      }`}
                    >
                      {m.change > 0 ? `+${m.change}` : m.change}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{m.newQuantity}</td>
                    <td className="px-3 py-3 text-[#5A6075]">{m.reason}</td>
                    <td className="px-5 py-3 text-[#5A6075]">{m.actor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination && <Pager pagination={pagination} onPage={setPage} busy={loading} noun="change" />}
      </Card>
    </div>
  );
}
