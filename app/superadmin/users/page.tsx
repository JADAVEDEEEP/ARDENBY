'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';

import { getCurrentAdmin } from '@/components/admin/admin-auth';
import { ConfirmedChangeDialog, describeResult } from '@/components/admin/confirmed-change-dialog';
import {
  SuperAdminUser,
  UsersResponse,
  errorMessage,
  formatDate,
  superAdminRequest,
} from '@/lib/superadmin-api';
import { cn } from '@/lib/utils';

type Role = SuperAdminUser['role'];

const ROLE_LABEL: Record<Role, string> = {
  customer: 'Customer',
  admin: 'Common Admin',
  superadmin: 'Super Admin',
};

const ROLE_TONE: Record<Role, string> = {
  customer: 'border-[#E3E5EE]/40 text-[#5A6075]',
  admin: 'border-[#E3E5EE]/40 text-[#5A6075]',
  superadmin: 'border-[#E3E5EE] text-[#4338CA]',
};

const PAGE_SIZE = 10;

const card = 'rounded-xl border border-[#E3E5EE] bg-[#FFFFFF]';
const field =
  'h-11 rounded-lg border border-[#E3E5EE] bg-[#FFFFFF]/80 px-3 text-[15px] text-[#11162B] outline-none transition focus:border-[#4338CA]/70';

type Pending =
  | { kind: 'status'; user: SuperAdminUser; isActive: boolean }
  | { kind: 'role'; user: SuperAdminUser; role: Role };

function describe(p: Pending) {
  const who = p.user.fullName || p.user.email;
  if (p.kind === 'status') {
    return p.isActive
      ? {
          title: 'Reactivate account?',
          body: `${who} will be able to sign in again.`,
          action: 'Reactivate',
          danger: false,
        }
      : {
          title: 'Deactivate account?',
          body: `${who} will be signed out of every session and blocked from signing in until reactivated.`,
          action: 'Deactivate',
          danger: true,
        };
  }
  const toSuper = p.role === 'superadmin';
  return {
    title: toSuper ? 'Grant Super Admin access?' : 'Change role?',
    body: toSuper
      ? `${who} will get full Super Admin control, including managing other users. Only do this for someone you fully trust.`
      : `${who} will change from ${ROLE_LABEL[p.user.role]} to ${ROLE_LABEL[p.role]}.`,
    action: toSuper ? 'Grant access' : 'Change role',
    danger: toSuper || p.user.role !== 'customer',
  };
}

export default function SuperAdminUsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const [selfId, setSelfId] = useState<string | undefined>();
  const [pending, setPending] = useState<Pending | null>(null);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const latest = useRef(0);

  useEffect(() => {
    getCurrentAdmin().then((u) => setSelfId(u.id)).catch(() => {});
  }, []);

  // Wait for typing to pause before querying.
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
      const qs = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search) qs.set('search', search);
      if (role) qs.set('role', role);
      if (status) qs.set('status', status);
      const response = await superAdminRequest<UsersResponse & { success: boolean }>(`/users?${qs}`);
      if (request === latest.current) setData(response);
    } catch (e) {
      if (request === latest.current) setError(errorMessage(e));
    } finally {
      if (request === latest.current) setLoading(false);
    }
  }, [page, search, role, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const confirm = async () => {
    if (!pending) return;
    setSaving(true);
    setDialogError('');
    try {
      if (pending.kind === 'status') {
        await superAdminRequest(`/users/${pending.user.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ isActive: pending.isActive }),
        });
      }
      setNotice({ ok: true, text: 'Account updated.' });
      setPending(null);
      await load();
    } catch (e) {
      // Keep the dialog open so the reason (e.g. last Super Admin) is visible.
      setDialogError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const summary = data?.summary;
  const totalPages = data?.pagination.totalPages ?? 1;
  const filtered = Boolean(search || role || status);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ['All users', summary?.total],
          ['Customers', summary?.customers],
          ['Common admins', summary?.admins],
          ['Super admins', summary?.superadmins],
          ['Deactivated', summary?.inactive],
        ].map(([label, value]) => (
          <div key={label as string} className={cn(card, 'px-4 py-3')}>
            <p className="text-[12px] uppercase tracking-[0.18em] text-[#5A6075]">{label as string}</p>
            <p className="mt-1 font-serif text-2xl text-[#11162B]">{value === undefined ? '–' : (value as number)}</p>
          </div>
        ))}
      </div>

      <p className="text-[13px] text-[#5A6075]">
        Common Admin store tools (orders, products, coupons) stay in the Common Admin panel. Here you manage who has
        access.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4338CA]" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, email or phone"
            aria-label="Search users"
            className={cn(field, 'w-full pl-9 placeholder:text-[#5A6075]')}
          />
        </div>
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by role"
          className={field}
        >
          <option value="">All roles</option>
          <option value="customer">Customers</option>
          <option value="admin">Common Admins</option>
          <option value="superadmin">Super Admins</option>
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by status"
          className={field}
        >
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="inactive">Deactivated</option>
        </select>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#E3E5EE] px-3 text-[13px] font-semibold text-[#11162B] transition hover:bg-[#FFFFFF] disabled:opacity-60"
        >
          <RefreshCw className={cn('h-4 w-4 text-[#4338CA]', loading && 'animate-spin')} />
          Refresh
        </button>
        <button
          type="button"
          onClick={() => {
            setInviteName('');
            setInviteEmail('');
            setInviting(true);
          }}
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#4338CA] px-4 text-[13px] font-semibold text-white transition hover:bg-[#4338CA]"
        >
          Invite an Admin
        </button>
      </div>

      {notice && (
        <div
          role="status"
          className={cn(
            'rounded-lg border px-4 py-2.5 text-[15px]',
            notice.ok ? 'border-[#17603F]/40 bg-[#17603F]/10 text-[#17603F]' : 'border-[#9A2C1F]/40 bg-[#FBE3DF]/10 text-[#9A2C1F]'
          )}
        >
          {notice.text}
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-[#9A2C1F]/40 bg-[#FBE3DF]/10 px-4 py-2.5 text-[15px] text-[#9A2C1F]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <section className={cn(card, 'overflow-hidden')} aria-busy={loading}>
        {!data && loading ? (
          <div className="space-y-px" aria-label="Loading users">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse bg-[#FFFFFF]" />
            ))}
          </div>
        ) : !data ? null : data.users.length === 0 ? (
          <p className="px-5 py-12 text-center text-[15px] text-[#5A6075]">
            {filtered ? 'No users match these filters.' : 'No users found.'}
          </p>
        ) : (
          <div className={cn('overflow-x-auto transition-opacity', loading && 'opacity-60')}>
            <table className="w-full min-w-[820px] text-left text-[15px]">
              <thead>
                <tr className="border-b border-[#E3E5EE] text-[12px] uppercase tracking-[0.18em] text-[#5A6075]">
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-3 py-3 font-semibold">Role</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Joined</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => {
                  const isSelf = u.id === selfId;
                  return (
                    <tr key={u.id} className="border-b border-[#4338CA]/10 last:border-0">
                      <td className="px-5 py-3">
                        <p className="font-medium text-[#11162B]">
                          {u.fullName || '—'}
                          {isSelf && <span className="ml-2 text-[12px] uppercase tracking-wider text-[#4338CA]">You</span>}
                        </p>
                        <p className="text-[13px] text-[#5A6075]">{u.email}</p>
                        {u.phone && <p className="text-[13px] text-[#5A6075]">{u.phone}</p>}
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn('inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[12px] font-medium', ROLE_TONE[u.role])}>
                          {ROLE_LABEL[u.role]}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[13px]">
                        <span className={u.isActive ? 'text-[#17603F]' : 'text-[#9A2C1F]'}>
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                        <span className="block text-[#5A6075]">{u.emailVerified ? 'Email verified' : 'Not verified'}</span>
                      </td>
                      <td className="px-3 py-3 text-[13px] text-[#5A6075]">{formatDate(u.createdAt)}</td>
                      <td className="px-5 py-3">
                        {isSelf ? (
                          <p className="text-right text-[13px] text-[#5A6075]">Your own account</p>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <select
                              aria-label={`Role for ${u.email}`}
                              value={u.role}
                              disabled={!u.isActive}
                              title={u.isActive ? 'Change role' : 'Reactivate to change role'}
                              onChange={(e) => {
                                setNotice(null);
                                setDialogError('');
                                setPending({ kind: 'role', user: u, role: e.target.value as Role });
                              }}
                              className="h-9 rounded-md border border-[#E3E5EE] bg-[#FFFFFF] px-2 text-[13px] text-[#11162B] outline-none disabled:opacity-50"
                            >
                              <option value="customer">Customer</option>
                              <option value="admin">Common Admin</option>
                              <option value="superadmin">Super Admin</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                setNotice(null);
                                setDialogError('');
                                setPending({ kind: 'status', user: u, isActive: !u.isActive });
                              }}
                              className={cn(
                                'h-9 rounded-md border px-3 text-[13px] font-semibold transition',
                                u.isActive
                                  ? 'border-[#9A2C1F]/40 text-[#9A2C1F] hover:bg-[#FBE3DF]/10'
                                  : 'border-[#17603F]/40 text-[#17603F] hover:bg-[#17603F]/10'
                              )}
                            >
                              {u.isActive ? 'Deactivate' : 'Reactivate'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {data && data.pagination.total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E3E5EE] px-5 py-3 text-[13px] text-[#5A6075]">
            <span>
              Page {data.pagination.page} of {totalPages} · {data.pagination.total} user
              {data.pagination.total === 1 ? '' : 's'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1 || loading}
                aria-label="Previous page"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#E3E5EE] transition hover:bg-[#FFFFFF] disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages || loading}
                aria-label="Next page"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-[#E3E5EE] transition hover:bg-[#FFFFFF] disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {pending?.kind === 'role' && (
        <ConfirmedChangeDialog
          title={describe(pending).title}
          body={describe(pending).body}
          subject={pending.user.email}
          danger={describe(pending).danger}
          requestPath={`/users/${pending.user.id}/role/request`}
          requestBody={(reason) => ({ role: pending.role, reason })}
          applyPath={`/users/${pending.user.id}/role`}
          applyMethod="PATCH"
          applyBody={(reason, confirmationId, code) => ({ role: pending.role, reason, confirmationId, code })}
          applyLabel={describe(pending).action}
          onCancel={() => setPending(null)}
          onDone={(result) => {
            setNotice({ ok: true, text: describeResult(result, 'Role changed. Their old sessions were ended.') });
            setPending(null);
            void load();
          }}
        />
      )}

      {inviting && (
        <ConfirmedChangeDialog
          title="Invite an Admin"
          body="They get a Common Admin account with no password. They choose their own through “Forgot password” on the admin sign-in page, then sign in with a code each time."
          requestPath="/admins/request"
          requestBody={(reason) => ({ email: inviteEmail.trim(), fullName: inviteName.trim(), reason })}
          applyPath="/admins"
          applyMethod="POST"
          applyBody={(reason, confirmationId, code) => ({
            email: inviteEmail.trim(),
            fullName: inviteName.trim(),
            reason,
            confirmationId,
            code,
          })}
          canStart={inviteName.trim().length >= 2 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inviteEmail.trim())}
          extraFields={
            <>
              <div>
                <label htmlFor="inv-name" className="mb-1.5 block text-[13px] font-semibold text-[#11162B]">
                  Full name
                </label>
                <input
                  id="inv-name"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  maxLength={100}
                  className="w-full rounded-lg border border-[#E3E5EE] bg-[#FFFFFF] px-3 py-2 text-[15px] text-[#11162B] outline-none focus:border-[#4338CA]/70"
                />
              </div>
              <div>
                <label htmlFor="inv-email" className="mb-1.5 block text-[13px] font-semibold text-[#11162B]">
                  E-mail address
                </label>
                <input
                  id="inv-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  maxLength={254}
                  className="w-full rounded-lg border border-[#E3E5EE] bg-[#FFFFFF] px-3 py-2 text-[15px] text-[#11162B] outline-none focus:border-[#4338CA]/70"
                />
              </div>
            </>
          }
          applyLabel="Create Admin"
          onCancel={() => setInviting(false)}
          onDone={(result) => {
            setNotice({ ok: true, text: describeResult(result, 'Admin account created.') });
            setInviting(false);
            void load();
          }}
        />
      )}

      {pending?.kind === 'status' && (
        <ConfirmDialog
          pending={pending}
          saving={saving}
          error={dialogError}
          onCancel={() => !saving && setPending(null)}
          onConfirm={() => void confirm()}
        />
      )}
    </div>
  );
}

function ConfirmDialog({
  pending,
  saving,
  error,
  onCancel,
  onConfirm,
}: {
  pending: Pending;
  saving: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { title, body, action, danger } = describe(pending);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative w-full max-w-md rounded-xl border border-[#E3E5EE] bg-[#FFFFFF] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        <h2 id="confirm-title" className="font-serif text-xl text-[#11162B]">
          {title}
        </h2>
        <p className="mt-2 text-[15px] leading-6 text-[#5A6075]">{body}</p>
        <p className="mt-1 truncate text-[13px] text-[#5A6075]">{pending.user.email}</p>

        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-[#9A2C1F]/40 bg-[#FBE3DF]/10 px-3 py-2 text-[15px] text-[#9A2C1F]">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="h-11 rounded-lg border border-[#E3E5EE] px-4 text-[15px] text-[#11162B] transition hover:bg-[#FFFFFF]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className={cn(
              'inline-flex h-11 items-center gap-2 rounded-lg px-4 text-[15px] font-semibold transition disabled:opacity-60',
              danger ? 'bg-[#9A2C1F] text-white hover:bg-[#9A2C1F]/90' : 'bg-[#4338CA] text-white hover:bg-[#4338CA]'
            )}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {action}
          </button>
        </div>
      </div>
    </div>
  );
}
