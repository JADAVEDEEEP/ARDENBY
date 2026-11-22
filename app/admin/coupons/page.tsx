'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { BadgePercent, Pencil, Trash2 } from 'lucide-react';

import { adminApiRequest } from '@/components/admin/admin-auth';
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
  fieldClass,
  labelClass,
} from '@/components/admin/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

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

// adminApiRequest handles the base URL and the admin token.
const COUPONS_PATH = '/api/coupons';
const CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,29}$/;

const isActive = (coupon: Coupon) => Boolean(Number(coupon.active));
const isExpired = (coupon: Coupon) => new Date(coupon.expiry).getTime() < Date.now();

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const money = (value: number | string | null | undefined) =>
  `₹${Number(value || 0).toLocaleString('en-IN')}`;

export default function CouponManagementPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toDelete, setToDelete] = useState<Coupon | null>(null);

  const request = useCallback(
    (path: string, init?: RequestInit) => adminApiRequest<any>(`${COUPONS_PATH}${path}`, init),
    []
  );

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await request('');
      setCoupons(Array.isArray(data?.coupons) ? data.coupons : []);
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Could not load coupons.' });
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    void loadCoupons();
  }, [loadCoupons]);

  const stats = useMemo(() => {
    const expired = coupons.filter(isExpired).length;
    const active = coupons.filter((c) => isActive(c) && !isExpired(c)).length;
    return { total: coupons.length, active, inactive: coupons.length - active - expired, expired };
  }, [coupons]);

  const filteredCoupons = useMemo(() => {
    const q = search.trim().toLowerCase();
    return coupons.filter((coupon) => {
      const state = isExpired(coupon) ? 'expired' : isActive(coupon) ? 'active' : 'inactive';
      const matchesStatus = statusFilter === 'all' || state === statusFilter;
      const matchesSearch =
        !q || coupon.code.toLowerCase().includes(q) || (coupon.description || '').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [coupons, search, statusFilter]);

  function updateForm<K extends keyof CouponForm>(key: K, value: CouponForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setNotice(null);
  }

  async function submitCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    const code = form.code.trim().toUpperCase();
    const value = Number(form.discount_value);
    const minimum = form.min_order.trim() === '' ? 0 : Number(form.min_order);
    const maximum = form.max_discount.trim() === '' ? null : Number(form.max_discount);
    const fail = (text: string) => setNotice({ type: 'error', text });

    if (!CODE_PATTERN.test(code))
      return fail('Coupon code must be 3–30 characters: letters, numbers, hyphen or underscore.');
    if (!Number.isFinite(value) || value <= 0) return fail('Discount value must be greater than 0.');
    if (form.discount_type === 'percentage' && value > 100)
      return fail('A percentage discount cannot be more than 100.');
    if (!Number.isFinite(minimum) || minimum < 0) return fail('Minimum order must be 0 or more.');
    if (maximum !== null && (!Number.isFinite(maximum) || maximum <= 0))
      return fail('Maximum discount must be greater than 0, or left empty.');
    if (!form.expiry || Number.isNaN(new Date(form.expiry).getTime())) return fail('Choose a valid expiry date.');
    if (!editingId && new Date(form.expiry).getTime() <= Date.now())
      return fail('Expiry must be in the future for a new coupon.');

    const body = {
      code,
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: value,
      min_order: minimum,
      max_discount: form.discount_type === 'percentage' ? maximum : null,
      expiry: form.expiry,
      active: form.active,
    };

    setSaving(true);
    try {
      if (editingId) {
        await request(`/${encodeURIComponent(editingId)}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await request('', { method: 'POST', body: JSON.stringify(body) });
      }
      const text = editingId ? `Coupon ${code} updated.` : `Coupon ${code} created.`;
      setForm(emptyForm);
      setEditingId(null);
      await loadCoupons();
      setNotice({ type: 'success', text });
    } catch (error) {
      fail(error instanceof Error ? error.message : 'The coupon could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  function editCoupon(coupon: Coupon) {
    const date = new Date(coupon.expiry);
    const localDateTime = Number.isNaN(date.getTime())
      ? ''
      : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    setNotice(null);
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

  async function confirmDelete() {
    const coupon = toDelete;
    if (!coupon) return;
    setToDelete(null);
    setNotice(null);
    try {
      await request(`/${encodeURIComponent(coupon.id)}`, { method: 'DELETE' });
      setCoupons((previous) => previous.filter((item) => item.id !== coupon.id));
      setNotice({ type: 'success', text: `Coupon ${coupon.code} deleted.` });
      if (editingId === coupon.id) resetForm();
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'The coupon could not be deleted.' });
    }
  }

  return (
    <div>
      <PageHeader title="Coupons" subtitle="Create and manage discount coupons for your store." />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ['Total coupons', stats.total, 'text-[#11162B]'],
          ['Active', stats.active, 'text-[#17603F]'],
          ['Inactive', stats.inactive, 'text-[#7A4F00]'],
          ['Expired', stats.expired, 'text-[#9A2C1F]'],
        ].map(([label, value, color]) => (
          <div key={String(label)} className="rounded-xl border border-[#E3E5EE] bg-white p-5">
            <p className="text-[15px] font-semibold text-[#5A6075]">{label}</p>
            <p className={cn('mt-1.5 text-[34px] font-bold leading-none', String(color))}>{value}</p>
          </div>
        ))}
      </div>

      {notice && (
        <Notice tone={notice.type} className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <span>{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message" className="font-bold">
              ×
            </button>
          </div>
        </Notice>
      )}

      <form onSubmit={submitCoupon} noValidate className="mb-6">
        <Card
          title={editingId ? 'Edit coupon' : 'Create new coupon'}
          description={editingId ? 'The coupon code cannot be changed.' : 'Add a discount coupon to your store.'}
        >
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label htmlFor="c-code" className={labelClass}>
                Coupon code <span className="text-[#4338CA]">*</span>
              </label>
              <input
                id="c-code"
                value={form.code}
                disabled={!!editingId}
                onChange={(e) => updateForm('code', e.target.value.toUpperCase())}
                placeholder="e.g. DIWALI20"
                maxLength={30}
                className={cn(fieldClass, 'font-mono uppercase')}
              />
              <p className="mt-1.5 text-[13px] text-[#5A6075]">Letters, numbers, - and _ only.</p>
            </div>

            <div className="xl:col-span-2">
              <label htmlFor="c-desc" className={labelClass}>
                Description
              </label>
              <input
                id="c-desc"
                value={form.description}
                maxLength={255}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder="e.g. 20% off on all products"
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="c-type" className={labelClass}>
                Discount type <span className="text-[#4338CA]">*</span>
              </label>
              <select
                id="c-type"
                value={form.discount_type}
                onChange={(e) => updateForm('discount_type', e.target.value as CouponForm['discount_type'])}
                className={fieldClass}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>

            <div>
              <label htmlFor="c-value" className={labelClass}>
                Discount value <span className="text-[#4338CA]">*</span>
              </label>
              <input
                id="c-value"
                type="number"
                min="0.01"
                max={form.discount_type === 'percentage' ? 100 : undefined}
                step="0.01"
                value={form.discount_value}
                onChange={(e) => updateForm('discount_value', e.target.value)}
                placeholder={form.discount_type === 'percentage' ? 'e.g. 20' : 'e.g. 100'}
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="c-min" className={labelClass}>
                Minimum order value (₹)
              </label>
              <input
                id="c-min"
                type="number"
                min="0"
                step="0.01"
                value={form.min_order}
                onChange={(e) => updateForm('min_order', e.target.value)}
                className={fieldClass}
              />
              <p className="mt-1.5 text-[13px] text-[#5A6075]">0 for no minimum.</p>
            </div>

            <div>
              <label htmlFor="c-max" className={labelClass}>
                Maximum discount (₹)
              </label>
              <input
                id="c-max"
                type="number"
                min="0"
                step="0.01"
                value={form.max_discount}
                disabled={form.discount_type === 'flat'}
                onChange={(e) => updateForm('max_discount', e.target.value)}
                placeholder={form.discount_type === 'flat' ? 'Not used for flat coupons' : 'Empty = no limit'}
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="c-expiry" className={labelClass}>
                Expiry date &amp; time <span className="text-[#4338CA]">*</span>
              </label>
              <input
                id="c-expiry"
                type="datetime-local"
                value={form.expiry}
                onChange={(e) => updateForm('expiry', e.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="flex items-center gap-3 self-end pb-1.5">
              <button
                type="button"
                role="switch"
                aria-checked={form.active}
                aria-label="Coupon active"
                onClick={() => updateForm('active', !form.active)}
                className={cn(
                  'relative h-7 w-12 shrink-0 rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-[#4338CA]/50 focus-visible:ring-offset-2',
                  form.active ? 'bg-[#4338CA]' : 'bg-[#F5F6FA]'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all',
                    form.active ? 'left-[22px]' : 'left-0.5'
                  )}
                />
              </button>
              <div>
                <p className="text-[15px] font-semibold text-[#11162B]">{form.active ? 'Active' : 'Inactive'}</p>
                <p className="text-[13px] text-[#5A6075]">Inactive coupons cannot be used.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#E3E5EE] pt-5">
            <button disabled={saving} type="submit" className={btnPrimary}>
              {saving ? 'Saving…' : editingId ? 'Update coupon' : 'Create coupon'}
            </button>
            <button type="button" onClick={resetForm} className={btnOutline}>
              {editingId ? 'Cancel edit' : 'Reset'}
            </button>
          </div>
        </Card>
      </form>

      <Card
        title="All coupons"
        description="View, edit and manage every coupon."
        bodyClassName="p-0 md:p-0"
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code or description…"
              aria-label="Search coupons"
              className={cn(fieldClass, 'sm:w-64')}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className={cn(fieldClass, 'sm:w-40')}
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        }
      >
        {loading ? (
          <Spinner label="Loading coupons" />
        ) : filteredCoupons.length === 0 ? (
          <EmptyState icon={BadgePercent} title="No coupons found">
            {coupons.length === 0 ? 'Create your first coupon above.' : 'Try a different search or filter.'}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left text-[15px]">
              <thead className="bg-[#F5F6FA] text-[13px] uppercase tracking-wider text-[#5A6075]">
                <tr>
                  {['Code', 'Description', 'Type', 'Value', 'Min order', 'Max discount', 'Expiry', 'Status', 'Actions'].map(
                    (heading) => (
                      <th key={heading} className="px-4 py-3 font-semibold">
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E5EE]">
                {filteredCoupons.map((coupon) => {
                  const expired = isExpired(coupon);
                  return (
                    <tr key={coupon.id} className="transition hover:bg-[#F5F6FA]">
                      <td className="px-4 py-3.5 font-mono font-bold tracking-wide text-[#11162B]">{coupon.code}</td>
                      <td className="max-w-56 truncate px-4 py-3.5 text-[#5A6075]">{coupon.description || '—'}</td>
                      <td className="px-4 py-3.5">
                        <StatusPill tone="neutral">
                          {coupon.discount_type === 'percentage' ? 'Percentage' : 'Flat'}
                        </StatusPill>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-[#11162B]">
                        {coupon.discount_type === 'percentage'
                          ? `${Number(coupon.discount_value)}%`
                          : money(coupon.discount_value)}
                      </td>
                      <td className="px-4 py-3.5">{money(coupon.min_order)}</td>
                      <td className="px-4 py-3.5">
                        {coupon.max_discount == null || Number(coupon.max_discount) === 0
                          ? '—'
                          : money(coupon.max_discount)}
                      </td>
                      <td className="px-4 py-3.5">{formatDate(coupon.expiry)}</td>
                      <td className="px-4 py-3.5">
                        {expired ? (
                          <StatusPill tone="error">Expired</StatusPill>
                        ) : isActive(coupon) ? (
                          <StatusPill tone="success">Active</StatusPill>
                        ) : (
                          <StatusPill tone="warning">Inactive</StatusPill>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => editCoupon(coupon)}
                            aria-label={`Edit ${coupon.code}`}
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E3E5EE] text-[#11162B] transition hover:border-[#E3E5EE]"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setToDelete(coupon)}
                            aria-label={`Delete ${coupon.code}`}
                            className={cn(btnDanger, '!min-h-10 !w-10 !px-0')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete coupon {toDelete?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the coupon. It can no longer be applied at checkout. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()} className="bg-[#9A2C1F] text-white hover:bg-[#9A2C1F]/90">
              Delete coupon
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
