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
    if (q === null) return <span className="text-white/30">—</span>;
    const st = stateOfQty(q);
    return (
      <span
        className={
          st === 'out'
            ? 'rounded-md bg-red-500/20 px-2 py-1 font-bold text-red-300'
            : st === 'low'
              ? 'rounded-md bg-amber-500/20 px-2 py-1 font-bold text-amber-300'
              : 'px-2 py-1 text-white/85'
        }
      >
        {q}
        <span className="sr-only">{st === 'out' ? ' sold out' : st === 'low' ? ' low' : ''}</span>
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-[#0c0c0e] text-[#f4f2ec]">
      <div className="mx-auto max-w-[1200px] space-y-5 p-4 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
            <p className="mt-1 text-sm text-white/60">
              Stock per product and size. Low = {LOW_STOCK_THRESHOLD} or fewer pieces.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'attention'] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`min-h-[44px] rounded-full border px-4 text-sm font-semibold ${
                  filter === f ? 'border-amber-300 bg-amber-300/15 text-amber-200' : 'border-white/15 text-white/80'
                }`}
              >
                {f === 'all' ? 'All products' : 'Needs attention'}
              </button>
            ))}
            <button
              type="button"
              onClick={() => void load()}
              className="min-h-[44px] rounded-full border border-white/15 px-4 text-sm font-semibold"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </p>
        )}

        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#141416]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/60">
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
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={SIZES.length + 2} className="px-4 py-8 text-center text-white/60">
                    Loading…
                  </td>
                </tr>
              ) : shown.length === 0 ? (
                <tr>
                  <td colSpan={SIZES.length + 2} className="px-4 py-8 text-center text-white/60">
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
