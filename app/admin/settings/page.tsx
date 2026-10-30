'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Building2, Lock, PackageCheck, Palette, Save } from 'lucide-react';

import {
  AdminUser,
  adminApiRequest,
  clearAdminToken,
  endAdminSession,
  getCurrentAdmin,
} from '@/components/admin/admin-auth';
import {
  Card,
  Notice,
  PageHeader,
  Spinner,
  btnDark,
  btnOutline,
  btnPrimary,
  fieldClass,
  labelClass,
} from '@/components/admin/ui';
import { cn } from '@/lib/utils';

type Store = {
  storeName: string;
  contactEmail: string;
  contactPhone: string;
  description: string;
  supportEmail: string;
  supportPhone: string;
  supportHours: string;
};
type Brand = {
  displayName: string;
  announcementEnabled: boolean;
  announcement: string;
  metaTitle: string;
  metaDescription: string;
};
type Notifications = {
  newOrders: boolean;
  lowStock: boolean;
  failedPayments: boolean;
  cancellations: boolean;
  lowStockThreshold: number;
};
type Config = {
  currency: string;
  timezone: string;
  shipping: { freeShippingThreshold: number; shippingFee: number; gstRate: number };
  orderStatuses: string[];
};
type SettingsData = {
  settings: { store: Store; brand: Brand; notifications: Notifications };
  config: Config;
};

const TABS = [
  { id: 'store', label: 'Store', icon: Building2 },
  { id: 'brand', label: 'Brand', icon: Palette },
  { id: 'fulfilment', label: 'Orders & fulfilment', icon: PackageCheck },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'account', label: 'Account & security', icon: Lock },
] as const;
type TabId = (typeof TABS)[number]['id'];

/* ------------------------------------------------------------------ */
/* Generic editable section with dirty tracking                        */
/* ------------------------------------------------------------------ */

function useSection<T extends Record<string, unknown>>(
  section: string,
  saved: T | undefined,
  onSaved: (next: T) => void,
  onDirty: (key: string, dirty: boolean) => void
) {
  const [draft, setDraft] = useState<T | undefined>(saved);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => setDraft(saved), [saved]);

  const dirty = !!draft && !!saved && JSON.stringify(draft) !== JSON.stringify(saved);
  useEffect(() => onDirty(section, dirty), [dirty, section, onDirty]);

  const set = <K extends keyof T>(key: K, value: T[K]) => {
    setMessage(null);
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  };

  async function save(e?: FormEvent) {
    e?.preventDefault();
    if (!draft || !dirty || !saved) return;
    // Only send what changed so unrelated values are never overwritten.
    const changed: Record<string, unknown> = {};
    for (const k of Object.keys(draft)) if (draft[k] !== saved[k]) changed[k] = draft[k];
    setSaving(true);
    setMessage(null);
    try {
      const res = await adminApiRequest<{ settings: T }>(`/api/admin/settings/${section}`, {
        method: 'PUT',
        body: JSON.stringify(changed),
      });
      onSaved(res.settings);
      setMessage({ tone: 'success', text: 'Settings saved.' });
    } catch (err) {
      setMessage({ tone: 'error', text: err instanceof Error ? err.message : 'Could not save settings.' });
    } finally {
      setSaving(false);
    }
  }

  return { draft, set, save, saving, dirty, message, reset: () => setDraft(saved) };
}

function SaveBar({
  dirty,
  saving,
  message,
  onReset,
}: {
  dirty: boolean;
  saving: boolean;
  message: { tone: 'success' | 'error'; text: string } | null;
  onReset: () => void;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#E4E7EC] pt-5">
      <button type="submit" disabled={!dirty || saving} className={btnPrimary}>
        <Save className="h-4 w-4" />
        {saving ? 'Saving…' : 'Save changes'}
      </button>
      <button type="button" disabled={!dirty || saving} onClick={onReset} className={btnOutline}>
        Discard
      </button>
      {dirty && !message && <span className="text-[13px] font-medium text-[#C47A16]">Unsaved changes</span>}
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-[12px] text-[#626875]">{hint}</p>}
    </div>
  );
}

function Toggle({
  id,
  checked,
  onChange,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <label htmlFor={id} className="block cursor-pointer text-[15px] font-semibold text-[#111111]">
          {label}
        </label>
        <p className="mt-0.5 text-[13px] text-[#626875]">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-7 w-12 shrink-0 rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-[#E53935]/50 focus-visible:ring-offset-2',
          checked ? 'bg-[#E53935]' : 'bg-[#D0D5DD]'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all',
            checked ? 'left-[22px]' : 'left-0.5'
          )}
        />
      </button>
    </div>
  );
}

function ReadOnly({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-lg border border-[#E4E7EC] bg-[#F5F6F8] px-4 py-3">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-[#626875]">{label}</p>
      <p className="mt-1 text-[18px] font-bold text-[#111111]">{value}</p>
      {note && <p className="mt-1 text-[12px] text-[#626875]">{note}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */

type SectionProps<T extends Record<string, unknown>> = {
  saved: T;
  onSaved: (next: T) => void;
  onDirty: (key: string, dirty: boolean) => void;
};

function StoreTab({ saved, onSaved, onDirty }: SectionProps<Store>) {
  const f = useSection<Store>('store', saved, onSaved, onDirty);
  const d = f.draft;
  if (!d) return null;
  return (
    <form onSubmit={f.save} noValidate>
      <Card title="Store details" description="Used across the admin panel and for customer-facing contact details.">
        <div className="grid gap-5 md:grid-cols-2">
          <Field id="storeName" label="Store display name">
            <input id="storeName" className={fieldClass} maxLength={80} value={d.storeName} onChange={(e) => f.set('storeName', e.target.value)} />
          </Field>
          <Field id="contactEmail" label="Contact email">
            <input id="contactEmail" type="email" className={fieldClass} value={d.contactEmail} onChange={(e) => f.set('contactEmail', e.target.value)} />
          </Field>
          <Field id="contactPhone" label="Contact phone">
            <input id="contactPhone" type="tel" className={fieldClass} value={d.contactPhone} onChange={(e) => f.set('contactPhone', e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <ReadOnly label="Currency" value="INR (₹)" note="Fixed by the order system" />
            <ReadOnly label="Timezone" value="IST" note="Asia/Kolkata" />
          </div>
          <div className="md:col-span-2">
            <Field id="description" label="Store description" hint={`${d.description.length}/500`}>
              <textarea id="description" rows={3} maxLength={500} className={cn(fieldClass, 'h-auto py-3')} value={d.description} onChange={(e) => f.set('description', e.target.value)} />
            </Field>
          </div>
        </div>
        <h3 className="mb-4 mt-8 text-[16px] font-bold text-[#111111]">Support contact</h3>
        <div className="grid gap-5 md:grid-cols-3">
          <Field id="supportEmail" label="Support email">
            <input id="supportEmail" type="email" className={fieldClass} value={d.supportEmail} onChange={(e) => f.set('supportEmail', e.target.value)} />
          </Field>
          <Field id="supportPhone" label="Support phone">
            <input id="supportPhone" type="tel" className={fieldClass} value={d.supportPhone} onChange={(e) => f.set('supportPhone', e.target.value)} />
          </Field>
          <Field id="supportHours" label="Support hours">
            <input id="supportHours" className={fieldClass} maxLength={120} placeholder="Mon–Sat, 10am–6pm" value={d.supportHours} onChange={(e) => f.set('supportHours', e.target.value)} />
          </Field>
        </div>
        <SaveBar dirty={f.dirty} saving={f.saving} message={f.message} onReset={f.reset} />
      </Card>
    </form>
  );
}

function BrandTab({ saved, onSaved, onDirty }: SectionProps<Brand>) {
  const f = useSection<Brand>('brand', saved, onSaved, onDirty);
  const d = f.draft;
  if (!d) return null;
  return (
    <form onSubmit={f.save} noValidate className="space-y-6">
      <Card title="Brand identity">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <div>
            <p className={labelClass}>Current logo</p>
            <div className="flex h-32 items-center justify-center rounded-lg bg-[#111111] p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/kovenik-logo.svg" alt="KOVENIK logo" className="max-h-full max-w-full object-contain" />
            </div>
            <p className="mt-2 text-[12px] text-[#626875]">
              The logo is part of the site build and is not editable here, so existing brand assets stay untouched.
            </p>
          </div>
          <div className="space-y-5">
            <Field id="displayName" label="Brand display name">
              <input id="displayName" className={fieldClass} maxLength={60} value={d.displayName} onChange={(e) => f.set('displayName', e.target.value)} />
            </Field>
            <Field id="metaTitle" label="Storefront meta title" hint={`${d.metaTitle.length}/70`}>
              <input id="metaTitle" className={fieldClass} maxLength={70} value={d.metaTitle} onChange={(e) => f.set('metaTitle', e.target.value)} />
            </Field>
            <Field id="metaDescription" label="Storefront meta description" hint={`${d.metaDescription.length}/200`}>
              <textarea id="metaDescription" rows={3} maxLength={200} className={cn(fieldClass, 'h-auto py-3')} value={d.metaDescription} onChange={(e) => f.set('metaDescription', e.target.value)} />
            </Field>
          </div>
        </div>
      </Card>
      <Card title="Announcement bar" description="Short message for the storefront banner.">
        <Toggle id="announcementEnabled" checked={d.announcementEnabled} onChange={(v) => f.set('announcementEnabled', v)} label="Show announcement" description="Turn off to hide the message without deleting it." />
        <Field id="announcement" label="Announcement text" hint={`${d.announcement.length}/160`}>
          <input id="announcement" className={fieldClass} maxLength={160} value={d.announcement} onChange={(e) => f.set('announcement', e.target.value)} />
        </Field>
        <Notice tone="info" className="mt-5">
          These values are saved and available to the platform. The public storefront does not read them yet, so
          changes here will not appear on the live site until that is connected.
        </Notice>
        <SaveBar dirty={f.dirty} saving={f.saving} message={f.message} onReset={f.reset} />
      </Card>
    </form>
  );
}

function FulfilmentTab({ config }: { config: Config }) {
  return (
    <Card
      title="Orders & fulfilment"
      description="These rules are enforced by the order system in code, so they are shown read-only. Changing them safely requires a code change."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <ReadOnly label="Free shipping from" value={`₹${config.shipping.freeShippingThreshold}`} note="Order subtotal at or above this ships free" />
        <ReadOnly label="Shipping fee" value={`₹${config.shipping.shippingFee}`} note="Charged below the threshold" />
        <ReadOnly label="GST" value={`${Math.round(config.shipping.gstRate * 100)}%`} note="Applied after any coupon" />
      </div>
      <h3 className="mb-3 mt-8 text-[16px] font-bold text-[#111111]">Order statuses</h3>
      <div className="flex flex-wrap gap-2">
        {config.orderStatuses.map((s) => (
          <span key={s} className="rounded-full bg-[#F2F4F7] px-3.5 py-1.5 text-[13px] font-semibold text-[#111111]">
            {s}
          </span>
        ))}
      </div>
      <p className="mt-5 text-[13px] text-[#626875]">
        Customers can cancel while an order is Pending, Confirmed or Processing. Currency ({config.currency}) and
        timezone ({config.timezone}) apply to every order and cannot be changed retroactively.
      </p>
    </Card>
  );
}

function NotificationsTab({ saved, onSaved, onDirty }: SectionProps<Notifications>) {
  const f = useSection<Notifications>('notifications', saved, onSaved, onDirty);
  const d = f.draft;
  if (!d) return null;
  return (
    <form onSubmit={f.save} noValidate>
      <Card
        title="Admin alerts"
        description="Choose which alerts appear under the bell in the admin header. Alerts are computed live from your orders and stock."
      >
        <div className="divide-y divide-[#E4E7EC]">
          <Toggle id="newOrders" checked={d.newOrders} onChange={(v) => f.set('newOrders', v)} label="New orders" description="Orders placed in the last 24 hours." />
          <Toggle id="lowStock" checked={d.lowStock} onChange={(v) => f.set('lowStock', v)} label="Low-stock alerts" description="Products at or below the threshold, and sold-out products." />
          <Toggle id="failedPayments" checked={d.failedPayments} onChange={(v) => f.set('failedPayments', v)} label="Failed payments" description="Payments that failed in the last 7 days." />
          <Toggle id="cancellations" checked={d.cancellations} onChange={(v) => f.set('cancellations', v)} label="Order cancellations" description="Orders cancelled in the last 7 days." />
        </div>
        <div className="mt-4 max-w-xs">
          <Field id="lowStockThreshold" label="Low-stock threshold (units)" hint="Alert when a product has this many units or fewer.">
            <input id="lowStockThreshold" type="number" min={1} max={100} className={fieldClass} value={d.lowStockThreshold} onChange={(e) => f.set('lowStockThreshold', Number(e.target.value))} />
          </Field>
        </div>
        <Notice tone="info" className="mt-5">
          Alerts are shown inside the admin panel only. Email or SMS delivery is not set up.
        </Notice>
        <SaveBar dirty={f.dirty} saving={f.saving} message={f.message} onReset={f.reset} />
      </Card>
    </form>
  );
}

function AccountTab({ signOut }: { signOut: () => void }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getCurrentAdmin().then(setAdmin).catch(() => setAdmin(null));
  }, []);

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (next.length < 8) return setMsg({ tone: 'error', text: 'New password must be at least 8 characters.' });
    if (next !== confirm) return setMsg({ tone: 'error', text: 'The new passwords do not match.' });
    setBusy(true);
    try {
      await adminApiRequest('/api/users/me/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      setCurrent('');
      setNext('');
      setConfirm('');
      setMsg({ tone: 'success', text: 'Password changed.' });
    } catch (err) {
      setMsg({ tone: 'error', text: err instanceof Error ? err.message : 'Could not change password.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Your profile">
        <dl className="grid gap-4 sm:grid-cols-3">
          <ReadOnly label="Name" value={admin?.fullName || '—'} />
          <ReadOnly label="Email" value={admin?.email || '—'} />
          <ReadOnly label="Role" value={admin?.role ? admin.role[0].toUpperCase() + admin.role.slice(1) : '—'} />
        </dl>
      </Card>
      <Card title="Change password">
        <form onSubmit={changePassword} className="max-w-md space-y-4">
          <Field id="curPw" label="Current password">
            <input id="curPw" type="password" autoComplete="current-password" className={fieldClass} value={current} onChange={(e) => setCurrent(e.target.value)} />
          </Field>
          <Field id="newPw" label="New password" hint="At least 8 characters.">
            <input id="newPw" type="password" autoComplete="new-password" className={fieldClass} value={next} onChange={(e) => setNext(e.target.value)} />
          </Field>
          <Field id="cfmPw" label="Confirm new password">
            <input id="cfmPw" type="password" autoComplete="new-password" className={fieldClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
          <button type="submit" disabled={busy || !current || !next} className={btnDark}>
            {busy ? 'Updating…' : 'Update password'}
          </button>
          {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
        </form>
      </Card>
      <Card title="Session & security">
        <ul className="list-disc space-y-1.5 pl-5 text-[14px] text-[#626875]">
          <li>Admin access needs a private entry link, your password and an emailed one-time code.</li>
          <li>Your role is re-checked on the server for every request.</li>
          <li>Keys, secrets and database credentials are never shown in this panel.</li>
        </ul>
        <button type="button" onClick={signOut} className={cn(btnOutline, 'mt-5')}>
          Log out of this session
        </button>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function SettingsInner() {
  const params = useSearchParams();
  const initial = (TABS.find((t) => t.id === params.get('tab'))?.id ?? 'store') as TabId;
  const [tab, setTab] = useState<TabId>(initial);
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const dirtyRef = useRef<Record<string, boolean>>({});
  const router = useRouter();
  const signOut = useCallback(() => {
    clearAdminToken();
    void endAdminSession().finally(() => router.replace('/'));
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApiRequest<{ data: SettingsData }>('/api/admin/settings');
      setData(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onDirty = useCallback((key: string, dirty: boolean) => {
    dirtyRef.current[key] = dirty;
  }, []);

  // Warn before closing the tab with unsaved edits.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (Object.values(dirtyRef.current).some(Boolean)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  function switchTab(next: TabId) {
    if (Object.values(dirtyRef.current).some(Boolean) && !window.confirm('You have unsaved changes. Leave this tab and discard them?')) {
      return;
    }
    dirtyRef.current = {};
    setTab(next);
    // Re-sync drafts from the saved values.
    setData((d) => (d ? { ...d } : d));
  }

  const update = <K extends keyof SettingsData['settings']>(key: K) =>
    (next: SettingsData['settings'][K]) =>
      setData((d) => (d ? { ...d, settings: { ...d.settings, [key]: next } } : d));

  return (
    <div>
      <PageHeader title="Settings" subtitle="Store details, brand, alerts and your account." />

      <div role="tablist" aria-label="Settings sections" className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-[#E4E7EC] bg-white p-1.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => switchTab(t.id)}
              className={cn(
                'flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-4 text-[14px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#E53935]/50',
                active ? 'bg-[#111111] text-white' : 'text-[#626875] hover:bg-[#F2F4F7] hover:text-[#111111]'
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'account' ? (
        <AccountTab signOut={signOut} />
      ) : loading ? (
        <Spinner label="Loading settings" />
      ) : error || !data ? (
        <Notice tone="error">
          {error || 'Could not load settings.'}{' '}
          <button type="button" onClick={() => void load()} className="font-bold underline">
            Try again
          </button>
        </Notice>
      ) : (
        <div role="tabpanel">
          {tab === 'store' && <StoreTab saved={data.settings.store} onSaved={update('store')} onDirty={onDirty} />}
          {tab === 'brand' && <BrandTab saved={data.settings.brand} onSaved={update('brand')} onDirty={onDirty} />}
          {tab === 'fulfilment' && <FulfilmentTab config={data.config} />}
          {tab === 'notifications' && (
            <NotificationsTab saved={data.settings.notifications} onSaved={update('notifications')} onDirty={onDirty} />
          )}
        </div>
      )}

      <p className="mt-8 text-[13px] text-[#626875]">
        Customer accounts are managed by the Super Admin.{' '}
        <Link href="/admin" className="font-semibold text-[#E53935]">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<Spinner label="Loading settings" />}>
      <SettingsInner />
    </Suspense>
  );
}
