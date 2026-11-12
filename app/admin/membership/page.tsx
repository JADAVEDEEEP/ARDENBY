'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';

import { ReasonDialog } from '@/components/admin/reason-dialog';
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
import { message, opsRequest, toQuery, when } from '@/lib/admin-ops-api';
import { formatINR } from '@/lib/format';
import { PAYMENT_STATUS, PURCHASE_STATUS, type MembershipBenefit, type MembershipPlan } from '@/lib/membership-api';

type Tab = 'plans' | 'purchases';

type Purchase = {
  id: string;
  userId: string;
  email: string;
  name: string;
  planName: string;
  status: string;
  paymentStatus: string;
  amount: number | null;
  startDate: string | null;
  endDate: string | null;
  purchasedAt: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
};

type PurchaseList = {
  total: number;
  page: number;
  limit: number;
  summary: { activeMembers: number; expiredMembers: number; revenue: number };
  purchases: Purchase[];
};

type RuleRow = { productId: string; name: string; price: number; eligible: boolean; memberPrice: number | null; hasRule: boolean };

const BENEFIT_TYPES = [
  'DISCOUNT',
  'FREE_DELIVERY',
  'EARLY_ACCESS',
  'PRIORITY_SUPPORT',
  'EXCLUSIVE_OFFERS',
  'NEW_LAUNCH_NOTIFICATIONS',
  'BIRTHDAY_COUPON',
  'BIRTHDAY_REWARD',
];

type PlanForm = {
  id: string;
  name: string;
  description: string;
  price: string;
  durationDays: string;
  discountPercent: string;
  freeDelivery: boolean;
  active: boolean;
  benefits: { type: string; value: string; description: string; active: boolean }[];
};

const toForm = (p: MembershipPlan): PlanForm => ({
  id: p.id,
  name: p.name,
  description: p.description || '',
  price: String(p.price),
  durationDays: String(p.durationDays),
  discountPercent: String(p.discountPercent),
  freeDelivery: p.freeDelivery,
  active: p.active,
  benefits: p.benefits.map((b: MembershipBenefit) => ({
    type: b.type,
    value: b.value == null ? '' : String(b.value),
    description: b.description,
    active: b.active,
  })),
});

const statusTone = (s: string) =>
  s === 'active' ? 'success' : s === 'pending' ? 'warning' : s === 'expired' ? 'neutral' : 'error';

export default function AdminMembershipPage() {
  const [tab, setTab] = useState<Tab>('plans');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  return (
    <div>
      <PageHeader title="Membership" subtitle="Plans, member pricing, purchases and manual changes." />
      <div className="mb-5 flex gap-2" role="tablist">
        {(['plans', 'purchases'] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={tab === t ? btnPrimary : btnOutline}
          >
            {t === 'plans' ? 'Plans & pricing' : 'Purchases & members'}
          </button>
        ))}
      </div>
      {notice && <Notice tone="success">{notice}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      {tab === 'plans' ? (
        <PlansTab onNotice={(m) => { setNotice(m); setError(''); }} onError={(m) => { setError(m); setNotice(''); }} />
      ) : (
        <PurchasesTab onNotice={(m) => { setNotice(m); setError(''); }} onError={(m) => { setError(m); setNotice(''); }} />
      )}
    </div>
  );
}

type TabProps = { onNotice: (m: string) => void; onError: (m: string) => void };

function PlansTab({ onNotice, onError }: TabProps) {
  const [plans, setPlans] = useState<MembershipPlan[] | null>(null);
  const [cap, setCap] = useState('');
  const [form, setForm] = useState<PlanForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [rulesFor, setRulesFor] = useState<MembershipPlan | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await opsRequest<{ plans: MembershipPlan[]; settings: { maxTotalDiscountPercent: number } }>(
        '/api/admin/membership/plans'
      );
      setPlans(data.plans);
      setCap(String(data.settings.maxTotalDiscountPercent));
    } catch (e) {
      onError(message(e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const savePlan = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const body = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        durationDays: Number(form.durationDays),
        discountPercent: Number(form.discountPercent),
        freeDelivery: form.freeDelivery,
        active: form.active,
        benefits: form.benefits.map((b) => ({
          type: b.type,
          value: b.value === '' ? null : Number(b.value),
          description: b.description,
          active: b.active,
        })),
      };
      await opsRequest(`/api/admin/membership/plans/${form.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      onNotice('Membership plan updated.');
      setForm(null);
      await load();
    } catch (e) {
      onError(message(e));
    } finally {
      setSaving(false);
    }
  };

  const saveCap = async () => {
    try {
      await opsRequest('/api/admin/membership/settings', {
        method: 'PUT',
        body: JSON.stringify({ maxTotalDiscountPercent: Number(cap) }),
      });
      onNotice('Maximum combined discount saved.');
    } catch (e) {
      onError(message(e));
    }
  };

  if (!plans) return <Spinner />;
  const activePlans = plans.filter((p) => !p.retired);
  const retiredPlans = plans.filter((p) => p.retired);

  const set = <K extends keyof PlanForm>(key: K, value: PlanForm[K]) => setForm((f) => (f ? { ...f, [key]: value } : f));

  return (
    <div className="space-y-5">
      <Card
        title="KOVENIK MEMBER"
        description="The single membership plan. Price, validity, discount and benefits shown on the website come from here. Price and validity changes apply to new purchases only."
      >
        {activePlans.length === 0 ? (
          <EmptyState title="The membership plan is not set up yet">
            Run <code>node scripts/seed-membership-plans.js --apply</code> on the server to create KOVENIK MEMBER.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-[#E4E7EC]">
            {activePlans.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold">
                    {p.name} <span className="font-normal text-[#626875]">· {formatINR(p.price)} · {p.durationDays} days · {p.discountPercent}% off</span>
                  </p>
                  <p className="text-[13px] text-[#626875]">
                    Flat {p.discountPercent}% off eligible products
                    {p.freeDelivery ? ' · free shipping' : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone={p.active ? 'success' : 'neutral'}>{p.active ? 'Enabled' : 'Disabled'}</StatusPill>
                  <button className={btnOutline} onClick={() => setForm(toForm(p))}>Edit</button>
                  <button className={btnOutline} onClick={() => setRulesFor(rulesFor?.id === p.id ? null : p)}>Product pricing</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {rulesFor && <ProductRules plan={rulesFor} onNotice={onNotice} onError={onError} />}

      {retiredPlans.length > 0 && (
        <Card
          title="Retired plans"
          description="The old Bronze, Silver and Gold plans are no longer sold. They are kept so existing members and purchase history stay intact; a term already paid for runs until its end date and is treated as KOVENIK MEMBER (never worse than what was bought)."
        >
          <ul className="divide-y divide-[#E4E7EC]">
            {retiredPlans.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <p className="font-semibold">
                  {p.name}{' '}
                  <span className="font-normal text-[#626875]">
                    · {formatINR(p.price)} · {p.durationDays} days · {p.discountPercent}% off{p.freeDelivery ? ' · free shipping' : ''}
                  </span>
                </p>
                <StatusPill tone="neutral">Retired</StatusPill>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card
        title="Discount safety cap"
        description="Sale price + member discount + coupon together may never take more than this percentage off a product's list price (MRP)."
      >
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className={labelClass} htmlFor="cap">Maximum combined discount (%)</label>
            <input id="cap" className={fieldClass} inputMode="decimal" value={cap} onChange={(e) => setCap(e.target.value)} />
          </div>
          <button className={btnOutline} onClick={saveCap}><Save className="h-4 w-4" /> Save</button>
        </div>
      </Card>

      {form && (
        <Card title={`Edit ${form.name}`}>
          <div className="grid gap-4 md:grid-cols-3">
            {([
              ['Name', 'name'], ['Price (₹)', 'price'],
              ['Validity (days)', 'durationDays'], ['Member discount (% off selling price)', 'discountPercent'],
            ] as [string, keyof PlanForm][]).map(([label, key]) => (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <input className={fieldClass} value={String(form[key])} onChange={(e) => set(key, e.target.value as never)} />
              </div>
            ))}
            <div className="md:col-span-3">
              <label className={labelClass}>Description</label>
              <input className={fieldClass} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-[14px]">
              <input type="checkbox" checked={form.freeDelivery} onChange={(e) => set('freeDelivery', e.target.checked)} /> Free shipping on every order (not part of the standard plan)
            </label>
            <label className="flex items-center gap-2 text-[14px]">
              <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /> Enabled (shown and purchasable)
            </label>
          </div>

          <h3 className="mb-2 mt-6 text-[15px] font-bold">Benefits shown to customers</h3>
          <p className="mb-3 text-[13px] text-[#626875]">
            Removing a row hides it; nothing is deleted. Only list benefits that are actually delivered.
          </p>
          <div className="space-y-2">
            {form.benefits.map((b, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-[200px_100px_1fr_auto_auto]">
                <select
                  className={fieldClass}
                  value={b.type}
                  onChange={(e) => set('benefits', form.benefits.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))}
                >
                  {Array.from(new Set([...BENEFIT_TYPES, b.type])).map((t) => <option key={t}>{t}</option>)}
                </select>
                <input className={fieldClass} placeholder="Value" value={b.value} onChange={(e) => set('benefits', form.benefits.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                <input className={fieldClass} placeholder="Text shown to customers" value={b.description} onChange={(e) => set('benefits', form.benefits.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
                <label className="flex items-center gap-1.5 text-[13px]">
                  <input type="checkbox" checked={b.active} onChange={(e) => set('benefits', form.benefits.map((x, j) => (j === i ? { ...x, active: e.target.checked } : x)))} /> On
                </label>
                <button className={btnDanger} aria-label="Remove benefit" onClick={() => set('benefits', form.benefits.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button className={`${btnOutline} mt-3`} onClick={() => set('benefits', [...form.benefits, { type: 'EXCLUSIVE_OFFERS', value: '', description: '', active: true }])}>
            <Plus className="h-4 w-4" /> Add benefit
          </button>

          <div className="mt-6 flex gap-3">
            <button className={btnPrimary} disabled={saving} onClick={savePlan}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save plan
            </button>
            <button className={btnOutline} onClick={() => setForm(null)}>Cancel</button>
          </div>
        </Card>
      )}
    </div>
  );
}

function ProductRules({ plan, onNotice, onError }: { plan: MembershipPlan } & TabProps) {
  const [rows, setRows] = useState<RuleRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await opsRequest<{ products: RuleRow[] }>(`/api/admin/membership/plans/${plan.id}/products`);
      setRows(data.products);
    } catch (e) {
      onError(message(e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.id]);

  useEffect(() => {
    setRows(null);
    void load();
  }, [load]);

  const save = async (row: RuleRow, eligible: boolean, memberPrice: string) => {
    setBusy(row.productId);
    try {
      await opsRequest(`/api/admin/membership/plans/${plan.id}/products/${encodeURIComponent(row.productId)}`, {
        method: 'PUT',
        body: JSON.stringify({ eligible, memberPrice: memberPrice === '' ? null : Number(memberPrice) }),
      });
      onNotice(`${row.name}: member pricing saved.`);
      await load();
    } catch (e) {
      onError(message(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card
      title={`${plan.name}: product pricing`}
      description={`Default: every product gets ${plan.discountPercent}% off its current selling price (sale items included), within the discount cap. Exclude a product, or set a fixed member price that replaces the percentage.`}
    >
      {!rows ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-[#E4E7EC] text-[12px] uppercase tracking-wide text-[#626875]">
                <th className="py-2 pr-3">Product</th><th className="pr-3">Selling price</th><th className="pr-3">Eligible</th><th className="pr-3">Fixed member price (₹)</th><th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <RuleLine key={r.productId} row={r} busy={busy === r.productId} onSave={save} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function RuleLine({ row, busy, onSave }: { row: RuleRow; busy: boolean; onSave: (r: RuleRow, eligible: boolean, price: string) => void }) {
  const [eligible, setEligible] = useState(row.eligible);
  const [price, setPrice] = useState(row.memberPrice == null ? '' : String(row.memberPrice));
  const dirty = eligible !== row.eligible || price !== (row.memberPrice == null ? '' : String(row.memberPrice));
  return (
    <tr className="border-b border-[#F2F4F7]">
      <td className="py-2 pr-3">{row.name}</td>
      <td className="pr-3 tabular-nums">{formatINR(row.price)}</td>
      <td className="pr-3"><input type="checkbox" checked={eligible} onChange={(e) => setEligible(e.target.checked)} aria-label={`${row.name} eligible`} /></td>
      <td className="pr-3"><input className={`${fieldClass} max-w-[140px]`} inputMode="decimal" value={price} disabled={!eligible} onChange={(e) => setPrice(e.target.value)} placeholder="auto" /></td>
      <td><button className={btnOutline} disabled={!dirty || busy} onClick={() => onSave(row, eligible, price)}>{busy ? '…' : 'Save'}</button></td>
    </tr>
  );
}

function PurchasesTab({ onNotice, onError }: TabProps) {
  const [data, setData] = useState<PurchaseList | null>(null);
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<{ purchase: Purchase; kind: 'cancel' | 'reactivate' } | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await opsRequest<PurchaseList>(`/api/admin/membership/purchases${toQuery({ status, paymentStatus, q, page })}`));
    } catch (e) {
      onError(message(e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, paymentStatus, q, page]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!data) return <Spinner />;
  const pages = Math.max(1, Math.ceil(data.total / data.limit));

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Active members', String(data.summary.activeMembers)],
          ['Expired members', String(data.summary.expiredMembers)],
          ['Membership revenue', formatINR(data.summary.revenue)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-[#E4E7EC] bg-white p-4">
            <p className="text-[13px] text-[#626875]">{label}</p>
            <p className="mt-1 text-[24px] font-bold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <Card title="Purchases">
        <div className="mb-4 flex flex-wrap gap-3">
          <input className={`${fieldClass} max-w-[260px]`} placeholder="Search email, name, payment id" value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} />
          <select className={`${fieldClass} max-w-[170px]`} value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All statuses</option>
            {Object.entries(PURCHASE_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className={`${fieldClass} max-w-[190px]`} value={paymentStatus} onChange={(e) => { setPage(1); setPaymentStatus(e.target.value); }}>
            <option value="">All payments</option>
            {Object.entries(PAYMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        {data.purchases.length === 0 ? (
          <EmptyState title="No purchases found">Nothing matches these filters yet.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-[#E4E7EC] text-[12px] uppercase tracking-wide text-[#626875]">
                  <th className="py-2 pr-3">Customer</th><th className="pr-3">Plan</th><th className="pr-3">Status</th><th className="pr-3">Payment</th>
                  <th className="pr-3">Amount</th><th className="pr-3">Term</th><th className="pr-3">Razorpay reference</th><th />
                </tr>
              </thead>
              <tbody>
                {data.purchases.map((p) => (
                  <tr key={p.id} className="border-b border-[#F2F4F7] align-top">
                    <td className="py-2 pr-3"><div className="font-medium">{p.name}</div><div className="text-[#626875]">{p.email}</div></td>
                    <td className="pr-3">{p.planName}</td>
                    <td className="pr-3"><StatusPill tone={statusTone(p.status)}>{PURCHASE_STATUS[p.status] ?? p.status}</StatusPill></td>
                    <td className="pr-3">{PAYMENT_STATUS[p.paymentStatus] ?? p.paymentStatus}</td>
                    <td className="pr-3 tabular-nums">{p.amount == null ? '—' : formatINR(p.amount)}</td>
                    <td className="pr-3 text-[12.5px]">{p.startDate ? `${when(p.startDate)} → ${when(p.endDate!)}` : `Bought ${when(p.purchasedAt)}`}</td>
                    <td className="max-w-[200px] break-all pr-3 text-[12px] text-[#626875]">{p.razorpayPaymentId || p.razorpayOrderId || '—'}</td>
                    <td className="whitespace-nowrap">
                      {(p.status === 'active' || p.status === 'pending') && (
                        <button className={btnDanger} onClick={() => setAction({ purchase: p, kind: 'cancel' })}>Cancel</button>
                      )}
                      {p.status === 'cancelled' && p.startDate && p.endDate && new Date(p.endDate) > new Date() && p.paymentStatus !== 'refunded' && (
                        <button className={btnOutline} onClick={() => setAction({ purchase: p, kind: 'reactivate' })}>Reactivate</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-[13px] text-[#626875]">
          <span>Page {data.page} of {pages} · {data.total} total</span>
          <div className="flex gap-2">
            <button className={btnOutline} disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <button className={btnOutline} disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      </Card>

      {action && (
        <ReasonDialog
          title={action.kind === 'cancel' ? 'Cancel this membership?' : 'Reactivate this membership?'}
          description={`${action.purchase.name} · ${action.purchase.planName}. This is recorded in the audit log. Cancelling does not refund any payment.`}
          confirmLabel={action.kind === 'cancel' ? 'Cancel membership' : 'Reactivate'}
          danger={action.kind === 'cancel'}
          onClose={() => setAction(null)}
          onSubmit={async (reason) => {
            await opsRequest(`/api/admin/membership/purchases/${action.purchase.id}/status`, {
              method: 'POST',
              body: JSON.stringify({ action: action.kind, reason }),
            });
            onNotice(action.kind === 'cancel' ? 'Membership cancelled.' : 'Membership reactivated.');
            setAction(null);
            await load();
          }}
        />
      )}
    </div>
  );
}
