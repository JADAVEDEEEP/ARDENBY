'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

import { getCurrentAdmin } from '@/components/admin/admin-auth';
import { Card, Notice, PageHeader, btnDark, btnOutline, fieldClass, labelClass } from '@/components/admin/ui';
import { daysAgoIso, downloadCsv, message, toQuery, todayIso } from '@/lib/admin-ops-api';

const STATUSES = ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
const PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed', 'Partially Refunded', 'Refund Pending', 'Refunded'];

/** CSV downloads. The server decides what each role may export; this page only asks. */
export default function ExportsPage() {
  const [from, setFrom] = useState(daysAgoIso(29));
  const [to, setTo] = useState(todayIso());
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [includeCustomer, setIncludeCustomer] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  useEffect(() => {
    getCurrentAdmin()
      .then((u) => setIsOwner(u.role === 'superadmin'))
      .catch(() => {});
  }, []);

  const run = async (kind: 'orders' | 'summary') => {
    setBusy(kind);
    setError('');
    setDone('');
    try {
      const name =
        kind === 'orders'
          ? await downloadCsv(
              `${isOwner ? '/api/superadmin' : '/api/admin'}/exports/orders.csv${toQuery({
                from,
                to,
                status,
                paymentStatus,
                paymentMethod,
                includeCustomer: isOwner && includeCustomer ? '1' : undefined,
              })}`,
              'kovenik-orders.csv'
            )
          : await downloadCsv(`/api/superadmin/exports/sales-summary.csv${toQuery({ from, to })}`, 'kovenik-sales-summary.csv');
      setDone(`Downloaded ${name}. This export has been recorded in the audit log.`);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exports"
        subtitle="Download order data as a CSV file for your accountant or spreadsheet. Every export is recorded."
      />

      <Card title="Date range" description="Dates are Indian Standard Time. Up to 366 days at a time.">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className={labelClass} htmlFor="exp-from">
              From
            </label>
            <input id="exp-from" type="date" className={`${fieldClass} w-48`} value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="exp-to">
              To
            </label>
            <input id="exp-to" type="date" className={`${fieldClass} w-48`} value={to} min={from} max={todayIso()} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card
        title="Orders (CSV)"
        description="One row per order: status, payment method and status, items, subtotal, discount, shipping, tax, order total, amount collected, refunds confirmed and refunds pending. These money columns are kept separate on purpose."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass} htmlFor="exp-status">
              Order status
            </label>
            <select id="exp-status" className={fieldClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Any</option>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="exp-pay">
              Payment status
            </label>
            <select id="exp-pay" className={fieldClass} value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
              <option value="">Any</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="exp-method">
              Payment method
            </label>
            <select id="exp-method" className={fieldClass} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="">Any</option>
              <option value="online">Online</option>
              <option value="cod">Cash on delivery</option>
            </select>
          </div>
        </div>

        {isOwner ? (
          <label className="mt-4 flex items-start gap-2 text-[15px] text-[#11162B]">
            <input type="checkbox" className="mt-1" checked={includeCustomer} onChange={(e) => setIncludeCustomer(e.target.checked)} />
            <span>
              Include customer details (name, e-mail, phone, city, state, pincode). Personal data — keep the file safe.
            </span>
          </label>
        ) : (
          <p className="mt-4 text-[14px] text-[#5A6075]">
            Customer details are not included. Only a Super Admin can export them.
          </p>
        )}

        <div className="mt-5">
          <button type="button" className={btnDark} disabled={Boolean(busy)} onClick={() => void run('orders')}>
            <Download className="h-4 w-4" />
            {busy === 'orders' ? 'Preparing…' : 'Download orders CSV'}
          </button>
        </div>
      </Card>

      {isOwner && (
        <Card title="Sales summary (CSV)" description="One row per day plus a total row: orders, gross value, collected, refunded, refund pending, failed and cancelled. Super Admin only.">
          <button type="button" className={btnOutline} disabled={Boolean(busy)} onClick={() => void run('summary')}>
            <Download className="h-4 w-4" />
            {busy === 'summary' ? 'Preparing…' : 'Download sales summary CSV'}
          </button>
        </Card>
      )}

      {done && <Notice tone="success">{done}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}
