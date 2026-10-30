'use client';

import { useCallback, useEffect, useState } from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';

import { clearAdminToken, endAdminSession } from '@/components/admin/admin-auth';
import { Card, EmptyState, Notice, PageHeader, Spinner, btnDanger } from '@/components/admin/ui';
import { adminLoginUrl } from '@/lib/auth-redirect';
import { message, opsRequest, when } from '@/lib/admin-ops-api';

type Login = { id: string; method: string; ip: string | null; userAgent: string | null; at: string };

/** Your own sign-in history, and one button that ends every session you have. */
export default function SecurityPage() {
  const [logins, setLogins] = useState<Login[]>([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await opsRequest('/api/admin/security');
      setLogins(data.logins || []);
      setAvailable(data.available !== false);
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const signOutEverywhere = async () => {
    setBusy(true);
    setError('');
    try {
      await opsRequest('/api/admin/security/sign-out-everywhere', { method: 'POST' });
      clearAdminToken();
      await endAdminSession();
      window.location.replace(adminLoginUrl('/admin'));
    } catch (e) {
      setError(message(e));
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security"
        subtitle="See when your account signed in, and end all of your sessions if you think someone else has access."
      />

      <Card
        title="Sign out everywhere"
        description="Ends every session of your account on every device, including this one. You will need to sign in again."
      >
        {confirming ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[14px] text-[#111111]">Sign out of all devices now?</p>
            <button type="button" className={btnDanger} disabled={busy} onClick={() => void signOutEverywhere()}>
              <LogOut className="h-4 w-4" />
              {busy ? 'Signing out…' : 'Yes, sign out everywhere'}
            </button>
            <button type="button" className="text-[14px] font-semibold text-[#626875] underline" onClick={() => setConfirming(false)} disabled={busy}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" className={btnDanger} onClick={() => setConfirming(true)}>
            <LogOut className="h-4 w-4" /> Sign out everywhere
          </button>
        )}
      </Card>

      {error && <Notice tone="error">{error}</Notice>}

      <Card title="Recent sign-ins" description="Your last 20 sign-ins to the admin area. If one is not yours, sign out everywhere and tell the store owner." bodyClassName="p-0">
        {loading ? (
          <Spinner label="Loading sign-ins" />
        ) : !available ? (
          <EmptyState icon={ShieldCheck} title="Sign-in history is not switched on yet">
            It starts recording once the database update for this feature has been applied.
          </EmptyState>
        ) : logins.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No sign-ins recorded yet">
            New sign-ins from now on will appear here.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-[#E4E7EC]">
            {logins.map((l) => (
              <li key={l.id} className="flex flex-col gap-1 px-5 py-3 text-[14px] sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium text-[#111111]">{when(l.at)}</span>
                <span className="text-[#626875]">
                  {l.method === 'google' ? 'Google' : 'Password + e-mail code'} · {l.ip || 'unknown address'}
                </span>
                <span className="max-w-[320px] truncate text-[12px] text-[#98A0AE]" title={l.userAgent || ''}>
                  {l.userAgent || ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
