'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApiRequest } from '@/components/admin/admin-auth';
import { LOW_STOCK_THRESHOLD, getVariantStock, stateOfQty, totalStock } from '@/app/shop/shop-stock';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

type Row = { id: string; name: string; slug: string; total: number; bySize: Record<string, number | null> };

/** Admin-only stock matrix: product x size, sold-out cells red, low cells amber. */
export default function InventoryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'attention'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await adminApiRequest('/api/products?page=1&limit=1000');
      const list: any[] = Array.isArray(payload) ? payload : payload?.products ?? payload?.data?.products ?? [];
      setRows(
        list.map((p) => {
          const variants = getVariantStock(p);
          const bySize: Record<string, number | null> = {};
          for (const s of SIZES) {
            const matches = variants.filter((v) => v.size === s);
            bySize[s] = matches.length ? matches.reduce((n, v) => n + v.stock, 0) : null;
          }
          return { id: p.id, name: p.name, slug: p.slug, total: totalStock(p), bySize };
        })
      );
    } catch (e) {
      console.error('[admin/inventory] load failed', e);
      setError(e instanceof Error ? e.message : 'Could not load inventory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const shown = useMemo(
    () =>
      filter === 'all'
        ? rows
        : rows.filter((r) => SIZES.some((s) => r.bySize[s] !== null && stateOfQty(r.bySize[s] as number) !== 'in')),
    [rows, filter]
  );

  const cell = (q: number | null) => {
    if (q === null) return <span className="text-[#98A0AE]">—</span>;
    const st = stateOfQty(q);
    return (
      <span
        className={
          st === 'out'
            ? 'rounded-md bg-[#D92D20]/8 px-2 py-1 font-bold text-[#B42318]'
            : st === 'low'
              ? 'rounded-md bg-[#C47A16]/15 px-2 py-1 font-bold text-[#8A540C]'
              : 'px-2 py-1 text-[#111111]'
        }
      >
        {q}
        <span className="sr-only">{st === 'out' ? ' sold out' : st === 'low' ? ' low' : ''}</span>
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-transparent text-[#111111]">
      <div className="mx-auto max-w-[1200px] space-y-5 p-4 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-bold tracking-tight text-[#111111] sm:text-[40px]">Inventory</h1>
            <p className="mt-1 text-sm text-[#626875]">
              Stock per product and size. Low = {LOW_STOCK_THRESHOLD} or fewer pieces.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/admin/inventory/history"
              className="inline-flex min-h-[44px] items-center rounded-full border border-[#E4E7EC] px-4 text-sm font-semibold text-[#111111] hover:border-[#111111]"
            >
              Stock history
            </a>
            {(['all', 'attention'] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`min-h-[44px] rounded-full border px-4 text-sm font-semibold ${
                  filter === f ? 'border-[#E53935] bg-[#E53935]/15 text-[#111111]' : 'border-[#E4E7EC] text-[#111111]'
                }`}
              >
                {f === 'all' ? 'All products' : 'Needs attention'}
              </button>
            ))}
            <button
              type="button"
              onClick={() => void load()}
              className="min-h-[44px] rounded-full border border-[#E4E7EC] px-4 text-sm font-semibold"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-[#D92D20]/30 bg-[#D92D20]/8 p-3 text-sm text-[#B42318]">
            {error}
          </p>
        )}

        <div className="overflow-x-auto rounded-2xl border border-[#E4E7EC] bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-[#E4E7EC] text-xs uppercase tracking-wider text-[#626875]">
              <tr>
                <th className="px-4 py-3">Product</th>
                {SIZES.map((s) => (
                  <th key={s} className="px-3 py-3 text-center">
                    {s}
                  </th>
                ))}
                <th className="px-3 py-3 text-center">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC]">
              {loading ? (
                <tr>
                  <td colSpan={SIZES.length + 2} className="px-4 py-8 text-center text-[#626875]">
                    Loading…
                  </td>
                </tr>
              ) : shown.length === 0 ? (
                <tr>
                  <td colSpan={SIZES.length + 2} className="px-4 py-8 text-center text-[#626875]">
                    Nothing to show.
                  </td>
                </tr>
              ) : (
                shown.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-semibold">{r.name}</td>
                    {SIZES.map((s) => (
                      <td key={s} className="px-3 py-3 text-center">
                        {cell(r.bySize[s])}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-center font-bold">{cell(r.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
