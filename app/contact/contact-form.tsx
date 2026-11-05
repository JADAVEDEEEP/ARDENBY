'use client';

import { useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';

import { apiUrl } from '@/lib/api-url';
import { cn } from '@/lib/utils';

// Mirrors the server rules in ArdenBy_Backend/services/support.service.js (the server re-checks all of them).
const LIMITS = { name: 80, email: 254, orderNumber: 40, subject: 120, message: 2000 } as const;
const MIN_MESSAGE = 10;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

type Field = 'name' | 'email' | 'orderNumber' | 'subject' | 'message';
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;
type Status = 'idle' | 'sending' | 'success' | 'error';

const EMPTY: Values = { name: '', email: '', orderNumber: '', subject: '', message: '' };

function validate(v: Values): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = 'Please enter your name.';
  if (!v.email.trim()) e.email = 'Please enter your email address.';
  else if (!EMAIL.test(v.email.trim())) e.email = 'That email address does not look right.';
  const order = v.orderNumber.trim();
  if (order && !/^[A-Za-z0-9#\-_ ]{3,40}$/.test(order)) e.orderNumber = 'Use letters, numbers and dashes only (at least 3 characters).';
  if (!v.subject.trim()) e.subject = 'Please add a subject.';
  const len = v.message.trim().length;
  if (len < MIN_MESSAGE) e.message = `Please write at least ${MIN_MESSAGE} characters.`;
  return e;
}

const FIELD_ORDER: Field[] = ['name', 'email', 'orderNumber', 'subject', 'message'];

const INPUT =
  'block w-full border-2 bg-white px-4 text-[17px] text-[#111111] outline-none transition-colors placeholder:text-[#6B6B6B] focus:border-[#C62828] disabled:bg-[#F5F5F5] disabled:text-[#6B6B6B]';

export function ContactForm() {
  const uid = useId();
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverError, setServerError] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const id = (f: Field) => `${uid}-${f}`;
  const sending = status === 'sending';

  const set = (field: Field, value: string) => {
    const next = { ...values, [field]: value };
    setValues(next);
    if (touched[field] || errors[field]) setErrors((prev) => ({ ...prev, [field]: validate(next)[field] }));
  };

  const blur = (field: Field) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validate(values)[field] }));
  };

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (sending) return;

    const found = validate(values);
    setErrors(found);
    setTouched({ name: true, email: true, orderNumber: true, subject: true, message: true });
    const firstBad = FIELD_ORDER.find((f) => found[f]);
    if (firstBad) {
      setStatus('idle');
      setServerError('');
      formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(id(firstBad))}`)?.focus();
      return;
    }

    setStatus('sending');
    setServerError('');
    try {
      const response = await fetch(apiUrl('/api/support'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          orderNumber: values.orderNumber.trim(),
          subject: values.subject.trim(),
          message: values.message.trim(),
          website: honeypot,
        }),
      });
      const data = (await response.json().catch(() => null)) as { success?: boolean; message?: string } | null;
      if (response.ok && data?.success) {
        setStatus('success');
        setValues(EMPTY);
        setTouched({});
        requestAnimationFrame(() => successRef.current?.focus());
        return;
      }
      setServerError(data?.message || 'We could not send your message. Please try again.');
      setStatus('error');
    } catch {
      setServerError('We could not reach the server. Check your connection and try again.');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="border-2 border-[#111111] bg-white p-8 outline-none md:p-12"
      >
        <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center bg-[#C62828] text-[28px] font-bold text-white">
          ✓
        </span>
        <h2 className="mt-6 font-oswald text-[clamp(32px,6vw,48px)] font-bold uppercase leading-[1]">Message sent</h2>
        <p className="mt-4 max-w-[44ch] text-[17px] leading-[1.7] text-[#444444]">
          Thank you. We have received your message and will reply to the email address you gave us.
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus('idle');
            setErrors({});
          }}
          className="mt-8 inline-flex min-h-[52px] items-center justify-center border-2 border-[#111111] px-8 text-[14px] font-bold uppercase tracking-[0.14em] transition-colors hover:bg-[#111111] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111]"
        >
          Send another message
        </button>
      </div>
    );
  }

  const errorCount = FIELD_ORDER.filter((f) => errors[f]).length;

  const fieldProps = (f: Field) => ({
    id: id(f),
    name: f,
    value: values[f],
    disabled: sending,
    maxLength: LIMITS[f],
    'aria-invalid': errors[f] ? (true as const) : undefined,
    'aria-describedby': errors[f] ? `${id(f)}-error` : undefined,
    onChange: (e: { target: { value: string } }) => set(f, e.target.value),
    onBlur: () => blur(f),
    className: cn(INPUT, errors[f] ? 'border-[#B3261E]' : 'border-[#111111]'),
  });

  const Label = ({ f, children, optional }: { f: Field; children: string; optional?: boolean }) => (
    <label htmlFor={id(f)} className="mb-2 flex items-baseline justify-between text-[14px] font-bold uppercase tracking-[0.14em] text-[#111111]">
      {children}
      {optional && <span className="text-[12px] font-medium normal-case tracking-normal text-[#555555]">Optional</span>}
    </label>
  );

  const FieldError = ({ f }: { f: Field }) =>
    errors[f] ? (
      <p id={`${id(f)}-error`} className="mt-2 text-[15px] font-medium text-[#B3261E]">
        {errors[f]}
      </p>
    ) : null;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate aria-busy={sending} className="space-y-6">
      {(status === 'error' || errorCount > 0) && (
        <div role="alert" className="border-l-[4px] border-[#B3261E] bg-[#FDECEA] px-5 py-4 text-[16px] leading-[1.6] text-[#5F140F]">
          {status === 'error' ? serverError : `Please fix ${errorCount} ${errorCount === 1 ? 'field' : 'fields'} below.`}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label f="name">Your name</Label>
          <input {...fieldProps('name')} type="text" autoComplete="name" className={fieldProps('name').className + ' h-[56px]'} />
          <FieldError f="name" />
        </div>
        <div>
          <Label f="email">Email</Label>
          <input {...fieldProps('email')} type="email" autoComplete="email" inputMode="email" className={fieldProps('email').className + ' h-[56px]'} />
          <FieldError f="email" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <Label f="orderNumber" optional>Order number</Label>
          <input
            {...fieldProps('orderNumber')}
            type="text"
            autoComplete="off"
            placeholder="If your question is about an order"
            className={fieldProps('orderNumber').className + ' h-[56px]'}
          />
          <FieldError f="orderNumber" />
        </div>
        <div>
          <Label f="subject">Subject</Label>
          <input {...fieldProps('subject')} type="text" autoComplete="off" className={fieldProps('subject').className + ' h-[56px]'} />
          <FieldError f="subject" />
        </div>
      </div>

      <div>
        <Label f="message">Message</Label>
        <textarea {...fieldProps('message')} rows={7} className={fieldProps('message').className + ' resize-y py-4 leading-[1.6]'} />
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <FieldError f="message" />
          </div>
          <p className="ml-auto shrink-0 text-[13px] text-[#555555]" aria-hidden="true">
            {values.message.length}/{LIMITS.message}
          </p>
        </div>
      </div>

      {/* Honeypot: hidden from people and assistive tech; bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </label>
      </div>

      <button
        type="submit"
        disabled={sending}
        className="inline-flex min-h-[56px] w-full items-center justify-center gap-3 bg-[#C62828] px-8 text-[15px] font-bold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#A91F1F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C62828] disabled:cursor-not-allowed disabled:bg-[#6B6B6B] md:w-auto md:min-w-[260px]"
      >
        {sending && (
          <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        )}
        {sending ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
