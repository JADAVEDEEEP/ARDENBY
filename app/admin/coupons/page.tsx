'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { adminApiRequest } from '@/components/admin/admin-auth';

type Coupon = {
  id: string;
  code: string;
  description?: string | null;
  discount_type: 'percentage' | 'flat';
  discount_value: number | string;
  min_order: number | string;
  max_discount?: number | string | null;
  expiry: string;
  active: number | boolean;
  created_at?: string;
};

type CouponForm = {
  code: string;
  description: string;
  discount_type: 'percentage' | 'flat';
  discount_value: string;
  min_order: string;
  max_discount: string;
  expiry: string;
  active: boolean;
};

const emptyForm: CouponForm = {
  code: '',
  description: '',
  discount_type: 'percentage',
  discount_value: '',
  min_order: '0',
  max_discount: '',
  expiry: '',
  active: true,
};

// Same pattern as the Categories admin page: adminApiRequest handles the
// base URL and the admin JWT token, so no token code is needed here.
const COUPONS_PATH = '/api/coupons';

function isActive(coupon: Coupon): boolean {
  return Boolean(Number(coupon.active));
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function money(value: number | string | null | undefined) {
  const amount = Number(value || 0);
  return `₹${amount.toLocaleString('en-IN')}`;
}

export default function CouponManagementPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const request = useCallback(async (path: string, init: RequestInit = {}) => {
    return adminApiRequest(`${COUPONS_PATH}${path}`, init);
  }, []);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await request('');
      setCoupons(
        Array.isArray(payload) ? payload : Array.isArray(payload?.coupons) ? payload.coupons : []
      );
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : 'Coupons load nahi hue.',
      });
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    void loadCoupons();
  }, [loadCoupons]);

  const stats = useMemo(() => {
    const active = coupons.filter(isActive);
    const expired = coupons.filter((coupon) => new Date(coupon.expiry).getTime() < Date.now());
    return {
      total: coupons.length,
      active: active.length,
      inactive: coupons.length - active.length,
      expired: expired.length,
    };
  }, [coupons]);

  const filteredCoupons = useMemo(() => {
    const query = search.trim().toLowerCase();
    return coupons.filter((coupon) => {
      const matchesSearch =
        !query ||
        coupon.code.toLowerCase().includes(query) ||
        (coupon.description || '').toLowerCase().includes(query);

      const expired = new Date(coupon.expiry).getTime() < Date.now();

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && isActive(coupon) && !expired) ||
        (statusFilter === 'inactive' && !isActive(coupon)) ||
        (statusFilter === 'expired' && expired);

      return matchesSearch && matchesStatus;
    });
  }, [coupons, search, statusFilter]);

  function updateForm<K extends keyof CouponForm>(key: K, value: CouponForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function submitCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    const value = Number(form.discount_value);
    const minimum = Number(form.min_order || 0);
    const maximum = form.max_discount.trim() === '' ? null : Number(form.max_discount);

    if (!form.code.trim()) return setNotice({ type: 'error', text: 'Coupon code required hai.' });
    if (!Number.isFinite(value) || value <= 0)
      return setNotice({ type: 'error', text: 'Discount value valid honi chahiye.' });
    if (!form.expiry) return setNotice({ type: 'error', text: 'Expiry date required hai.' });
    if (form.discount_type === 'percentage' && value > 100)
      return setNotice({ type: 'error', text: 'Percentage discount 100 se zyada nahi ho sakta.' });

    const body = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: value,
      min_order: minimum,
      max_discount: maximum,
      expiry: form.expiry,
      active: form.active,
    };

    setSaving(true);
    try {
      if (editingId) {
        await request(`/${encodeURIComponent(editingId)}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        setNotice({ type: 'success', text: 'Coupon successfully update ho gaya.' });
      } else {
        await request('', { method: 'POST', body: JSON.stringify(body) });
        setNotice({ type: 'success', text: 'Naya coupon successfully create ho gaya.' });
      }
      resetForm();
      await loadCoupons();
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : 'Coupon save nahi hua.',
      });
    } finally {
      setSaving(false);
    }
  }

  function editCoupon(coupon: Coupon) {
    const date = new Date(coupon.expiry);
    const localDateTime = Number.isNaN(date.getTime())
      ? ''
      : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value ?? ''),
      min_order: String(coupon.min_order ?? 0),
      max_discount: coupon.max_discount == null ? '' : String(coupon.max_discount),
      expiry: localDateTime,
      active: isActive(coupon),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteCoupon(coupon: Coupon) {
    if (!window.confirm(`Delete coupon ${coupon.code}? This cannot be undone.`)) return;
    setNotice(null);
    try {
      await request(`/${encodeURIComponent(coupon.id)}`, { method: 'DELETE' });
      setCoupons((previous) => previous.filter((item) => item.id !== coupon.id));
      setNotice({ type: 'success', text: `${coupon.code} delete ho gaya.` });
      if (editingId === coupon.id) resetForm();
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : 'Coupon delete nahi hua.',
      });
    }
  }

  const inputClass =
    'mt-2 w-full rounded-lg border border-emerald-900 bg-[#06170f] px-4 py-3 text-sm outline-none placeholder:text-emerald-100/30 focus:border-emerald-400';

  return (
    <main className="min-h-screen bg-[#020d08] text-[#edf7ef]">
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 md:p-8">
        {/* Header + stats */}
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-400/70 bg-emerald-500/10 text-3xl text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,.15)]">
              ％
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
            <p className="mt-1 text-sm text-emerald-100/60">
              Create and manage discount coupons for your store.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ['Total Coupons', stats.total, 'border-emerald-800', 'text-emerald-300'],
              ['Active', stats.active, 'border-emerald-600/70', 'text-emerald-300'],
              ['Inactive', stats.inactive, 'border-yellow-800/70', 'text-yellow-300'],
              ['Expired', stats.expired, 'border-red-900/80', 'text-red-300'],
            ].map(([label, value, border, color]) => (
              <div
                key={String(label)}
                className={`min-w-[125px] rounded-xl border ${border} bg-[#04170f] p-4`}
              >
                <div className="text-xs text-emerald-50/60">{label}</div>
                <div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Notice */}
        {notice && (
          <div
            role="status"
            className={`flex items-start justify-between gap-4 rounded-lg border px-4 py-3 text-sm ${
              notice.type === 'success'
                ? 'border-emerald-500/50 bg-emerald-900/30 text-emerald-200'
                : 'border-red-500/50 bg-red-950/40 text-red-200'
            }`}
          >
            <span>{notice.text}</span>
            <button onClick={() => setNotice(null)} aria-label="Dismiss message">
              ×
            </button>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={submitCoupon}
          className="overflow-hidden rounded-2xl border border-emerald-600/70 bg-gradient-to-br from-[#0a2918] via-[#04170f] to-[#03120c] shadow-[0_0_40px_rgba(16,185,129,.08)]"
        >
          <div className="border-b border-emerald-800/60 bg-gradient-to-r from-emerald-500/10 to-transparent px-5 py-5 md:px-7">
            <h2 className="text-xl font-bold">{editingId ? 'Edit Coupon' : 'Create New Coupon'}</h2>
            <p className="mt-1 text-sm text-emerald-100/60">Add a discount coupon to your store</p>
          </div>

          <div className="grid gap-5 p-5 md:grid-cols-2 xl:grid-cols-3 md:p-7">
            <label className="block text-sm font-medium">
              Coupon Code <span className="text-red-400">*</span>
              <input
                required
                value={form.code}
                onChange={(e) => updateForm('code', e.target.value.toUpperCase())}
                placeholder="e.g. DIWALI20"
                className={inputClass}
              />
              <span className="mt-1 block text-xs text-emerald-100/45">
                Will be converted to uppercase
              </span>
            </label>

            <label className="block text-sm font-medium">
              Description
              <input
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder="e.g. 20% off on all products"
                className={inputClass}
              />
            </label>

            <label className="block text-sm font-medium">
              Discount Type <span className="text-red-400">*</span>
              <select
                value={form.discount_type}
                onChange={(e) =>
                  updateForm('discount_type', e.target.value as CouponForm['discount_type'])
                }
                className={inputClass}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </label>

            <label className="block text-sm font-medium">
              Discount Value <span className="text-red-400">*</span>
              <input
                required
                type="number"
                min="0.01"
                max={form.discount_type === 'percentage' ? 100 : undefined}
                step="0.01"
                value={form.discount_value}
                onChange={(e) => updateForm('discount_value', e.target.value)}
                placeholder={form.discount_type === 'percentage' ? 'e.g. 20' : 'e.g. 100'}
                className={inputClass}
              />
            </label>

            <label className="block text-sm font-medium">
              Minimum Order Value (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.min_order}
                onChange={(e) => updateForm('min_order', e.target.value)}
                placeholder="0"
                className={inputClass}
              />
              <span className="mt-1 block text-xs text-emerald-100/45">
                0 for no minimum order
              </span>
            </label>

            <label className="block text-sm font-medium">
              Maximum Discount (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.max_discount}
                onChange={(e) => updateForm('max_discount', e.target.value)}
                placeholder="Leave empty for no limit"
                className={inputClass}
              />
              <span className="mt-1 block text-xs text-emerald-100/45">
                Primarily for percentage coupons
              </span>
            </label>

            <label className="block text-sm font-medium">
              Expiry Date <span className="text-red-400">*</span>
              <input
                required
                type="datetime-local"
                value={form.expiry}
                onChange={(e) => updateForm('expiry', e.target.value)}
                className={inputClass}
              />
            </label>

            <div className="flex items-center gap-3 self-center">
              <button
                type="button"
                role="switch"
                aria-checked={form.active}
                onClick={() => updateForm('active', !form.active)}
                className={`relative h-7 w-12 rounded-full transition ${
                  form.active ? 'bg-emerald-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
                    form.active ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
              <div>
                <div className="text-sm font-semibold">{form.active ? 'Active' : 'Inactive'}</div>
                <div className="text-xs text-emerald-100/50">Inactive coupons cannot be used</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-start gap-3 md:col-span-2 xl:col-span-1 xl:justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-emerald-700 px-5 py-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-900/50"
              >
                ↻ Reset
              </button>
              <button
                disabled={saving}
                type="submit"
                className="rounded-lg bg-gradient-to-r from-[#f0c85e] to-[#ffe9a1] px-6 py-3 text-sm font-bold text-[#17200e] shadow-[0_0_20px_rgba(240,200,94,.14)] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving…' : editingId ? '✓ Update Coupon' : '+ Create Coupon'}
              </button>
            </div>
          </div>
        </form>

        {/* Coupons list */}
        <section className="overflow-hidden rounded-2xl border border-emerald-800/80 bg-[#03140d]">
          <div className="flex flex-col gap-4 border-b border-emerald-900/70 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#f5d77b]">Coupons List</h2>
              <p className="mt-1 text-sm text-emerald-100/55">View, edit and manage all coupons</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search code or description…"
                className="min-w-0 rounded-lg border border-emerald-900 bg-[#06170f] px-4 py-2.5 text-sm outline-none placeholder:text-emerald-100/35 focus:border-emerald-400 sm:w-64"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-emerald-900 bg-[#06170f] px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
              <thead className="bg-emerald-950/80 text-[11px] uppercase tracking-wider text-emerald-100/65">
                <tr>
                  {[
                    '#',
                    'Code',
                    'Description',
                    'Type',
                    'Value',
                    'Min Order',
                    'Max Discount',
                    'Expiry',
                    'Status',
                    'Created At',
                    'Actions',
                  ].map((heading) => (
                    <th key={heading} className="px-4 py-3 font-semibold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-emerald-950">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-emerald-100/50">
                      Loading coupons…
                    </td>
                  </tr>
                ) : filteredCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-emerald-100/50">
                      No coupons found. Create your first coupon above.
                    </td>
                  </tr>
                ) : (
                  filteredCoupons.map((coupon, index) => {
                    const expired = new Date(coupon.expiry).getTime() < Date.now();
                    return (
                      <tr key={coupon.id} className="transition hover:bg-emerald-900/20">
                        <td className="px-4 py-3 text-emerald-100/55">{index + 1}</td>
                        <td className="px-4 py-3 font-bold tracking-wide">{coupon.code}</td>
                        <td className="max-w-56 truncate px-4 py-3 text-emerald-100/65">
                          {coupon.description || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-md border px-2 py-1 text-xs ${
                              coupon.discount_type === 'percentage'
                                ? 'border-emerald-600 bg-emerald-900/50 text-emerald-200'
                                : 'border-yellow-700 bg-yellow-900/30 text-yellow-200'
                            }`}
                          >
                            {coupon.discount_type === 'percentage' ? 'Percentage' : 'Flat'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {coupon.discount_type === 'percentage'
                            ? `${coupon.discount_value}%`
                            : money(coupon.discount_value)}
                        </td>
                        <td className="px-4 py-3">{money(coupon.min_order)}</td>
                        <td className="px-4 py-3">
                          {coupon.max_discount == null ? '—' : money(coupon.max_discount)}
                        </td>
                        <td className="px-4 py-3">{formatDate(coupon.expiry)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-md border px-2 py-1 text-xs ${
                              expired
                                ? 'border-slate-600 bg-slate-800 text-slate-200'
                                : isActive(coupon)
                                  ? 'border-emerald-600 bg-emerald-900/50 text-emerald-200'
                                  : 'border-red-700 bg-red-950/50 text-red-200'
                            }`}
                          >
                            {expired ? 'Expired' : isActive(coupon) ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-emerald-100/55">
                          {formatDate(coupon.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => editCoupon(coupon)}
                              title="Edit coupon"
                              className="rounded-md border border-yellow-600 px-2.5 py-1.5 text-yellow-200 hover:bg-yellow-900/30"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => void deleteCoupon(coupon)}
                              title="Delete coupon"
                              className="rounded-md border border-red-800 px-2.5 py-1.5 text-red-300 hover:bg-red-950/60"
                            >
                              ⌫
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}