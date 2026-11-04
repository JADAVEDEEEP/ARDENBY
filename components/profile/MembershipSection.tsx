'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Check, Loader2 } from 'lucide-react';

import { MemberBadge } from '@/components/membership/member-badge';

import { errorText } from '@/lib/customer-api';
import { formatINR } from '@/lib/format';
import {
  PAYMENT_STATUS,
  PURCHASE_STATUS,
  fetchMyMembership,
  formatDate,
  saveBirthday,
  type MyMembership,
} from '@/lib/membership-api';
import { EmptyPanel, SectionTitle } from './metal';

const rowStatus = (status: string, endDate: string | null) =>
  status === 'active' && endDate && new Date(endDate).getTime() <= Date.now() ? 'expired' : status;

/** "My Membership": current plan, dates, benefits, payments and previous plans. */
export function MembershipSection() {
  const [data, setData] = useState<MyMembership | null>(null);
  const [error, setError] = useState('');
  const [birthday, setBirthday] = useState('');
  const [savingBirthday, setSavingBirthday] = useState(false);
  const [birthdayNote, setBirthdayNote] = useState('');

  const load = useCallback(async () => {
    try {
      const result = await fetchMyMembership();
      setData(result);
      setBirthday(result.birthday ? String(result.birthday).slice(0, 10) : '');
      setError('');
    } catch (e) {
      setError(errorText(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <p className="text-[15px] text-[#B42318]">{error}</p>;
  if (!data) {
    return (
      <div className="flex items-center gap-2 text-[14px] text-[#666666]">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading your membership…
      </div>
    );
  }

  const { current, queued, history } = data;
  const payments = history.filter((h) => h.paymentStatus !== 'none' || h.amount);
  const previous = history.filter((h) => h.id !== current?.id && h.status !== 'pending');

  const onSaveBirthday = async () => {
    setSavingBirthday(true);
    setBirthdayNote('');
    try {
      await saveBirthday(birthday);
      setBirthdayNote('Saved.');
    } catch (e) {
      setBirthdayNote(errorText(e));
    } finally {
      setSavingBirthday(false);
    }
  };

  return (
    <div>
      <SectionTitle title="My Membership" sub="Your plan, benefits and payments." />

      {!current ? (
        <EmptyPanel
          icon={BadgeCheck}
          title="You are not a member yet"
          text="Join Bronze, Silver or Gold for member pricing, early access and more."
          action={
            <Link
              href="/membership"
              className="inline-flex min-h-[44px] items-center rounded-[3px] bg-[#E53935] px-6 text-[13px] font-bold uppercase tracking-[0.14em] text-white hover:bg-[#C62E2B]"
            >
              View plans
            </Link>
          }
        />
      ) : (
        <div className="rounded border border-[#E5E5E5] bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-4">
              <MemberBadge size={44} />
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#666666]">Current plan</p>
                <h3 className="mt-1 text-[26px] font-bold leading-none">{current.planName}</h3>
              </div>
            </div>
            <span className="rounded-full bg-[#1B7A43]/10 px-3 py-1 text-[13px] font-semibold text-[#14602F]">Active</span>
          </div>

          <dl className="mt-5 grid gap-4 text-[14px] sm:grid-cols-3">
            <div>
              <dt className="text-[#666666]">Activated</dt>
              <dd className="font-semibold">{formatDate(current.startDate)}</dd>
            </div>
            <div>
              <dt className="text-[#666666]">Expires</dt>
              <dd className="font-semibold">{formatDate(current.endDate)}</dd>
            </div>
            <div>
              <dt className="text-[#666666]">Member discount</dt>
              <dd className="font-semibold">{current.discountPercent}% on eligible products</dd>
            </div>
          </dl>

          <ul className="mt-5 grid gap-2 text-[14.5px] sm:grid-cols-2">
            {current.benefits.map((b) => (
              <li key={b.id} className="flex gap-2.5">
                <Check className="mt-1 h-4 w-4 shrink-0 text-[#1B7A43]" strokeWidth={2.4} aria-hidden />
                <span>{b.description}</span>
              </li>
            ))}
          </ul>

          {queued && (
            <p className="mt-5 rounded bg-[#F7F7F7] px-4 py-3 text-[14px]">
              Renewal paid: your next term starts on <strong>{formatDate(queued.startDate)}</strong> and runs until{' '}
              <strong>{formatDate(queued.endDate)}</strong>.
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {!queued && (
              <Link
                href={`/membership?plan=${encodeURIComponent(current.planSlug)}`}
                className="inline-flex min-h-[44px] items-center rounded-[3px] bg-[#111111] px-6 text-[13px] font-bold uppercase tracking-[0.14em] text-white hover:bg-[#2A2A2A]"
              >
                Renew
              </Link>
            )}
            <Link
              href="/membership"
              className="inline-flex min-h-[44px] items-center rounded-[3px] border border-[#111111] px-6 text-[13px] font-bold uppercase tracking-[0.14em] hover:bg-[#111111] hover:text-white"
            >
              Compare plans
            </Link>
          </div>
        </div>
      )}

      <div className="mt-6 rounded border border-[#E5E5E5] bg-white p-5 md:p-6">
        <h3 className="text-[16px] font-bold">Birthday</h3>
        <p className="mt-1 text-[14px] text-[#666666]">Add your birth date so members can receive their birthday benefit.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={birthday}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setBirthday(e.target.value)}
            className="min-h-[44px] rounded-[3px] border border-[#CFCFCF] px-3 text-[15px]"
            aria-label="Birth date"
          />
          <button
            type="button"
            disabled={!birthday || savingBirthday}
            onClick={onSaveBirthday}
            className="min-h-[44px] rounded-[3px] bg-[#111111] px-5 text-[13px] font-bold uppercase tracking-[0.14em] text-white disabled:opacity-50"
          >
            {savingBirthday ? 'Saving…' : 'Save'}
          </button>
          {birthdayNote && <span className="text-[14px] text-[#555555]">{birthdayNote}</span>}
        </div>
      </div>

      <HistoryTable
        title="Payment history"
        empty="No membership payments yet."
        rows={payments.map((h) => ({
          key: h.id,
          cells: [
            formatDate(h.purchasedAt),
            h.planName,
            h.amount == null ? '—' : formatINR(h.amount),
            PAYMENT_STATUS[h.paymentStatus] ?? h.paymentStatus,
            h.razorpayPaymentId || h.razorpayOrderId || '—',
          ],
        }))}
        headings={['Date', 'Plan', 'Amount', 'Payment', 'Reference']}
      />

      <HistoryTable
        title="Previous memberships"
        empty="No previous memberships."
        rows={previous.map((h) => {
          const status = rowStatus(h.status, h.endDate);
          return {
            key: h.id,
            cells: [h.planName, formatDate(h.startDate), formatDate(h.endDate), PURCHASE_STATUS[status] ?? status],
          };
        })}
        headings={['Plan', 'Started', 'Ended', 'Status']}
      />
    </div>
  );
}

function HistoryTable({
  title,
  headings,
  rows,
  empty,
}: {
  title: string;
  headings: string[];
  rows: { key: string; cells: string[] }[];
  empty: string;
}) {
  return (
    <div className="mt-6 rounded border border-[#E5E5E5] bg-white p-5 md:p-6">
      <h3 className="text-[16px] font-bold">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-[14px] text-[#666666]">{empty}</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-[#E5E5E5] text-[12px] uppercase tracking-wide text-[#666666]">
                {headings.map((h) => (
                  <th key={h} className="py-2 pr-4 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b border-[#F0F0F0] last:border-0">
                  {row.cells.map((cell, i) => (
                    <td key={i} className="max-w-[220px] truncate py-2.5 pr-4">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
