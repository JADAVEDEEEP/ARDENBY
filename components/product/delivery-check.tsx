'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

import { Lock, MapPin, MessageCircle, Ruler } from 'lucide-react';

import { RETURN_WINDOW_DAYS } from '@/lib/policy-facts';

/** Optional: set NEXT_PUBLIC_WHATSAPP_NUMBER (digits with country code, e.g. 919876543210) to show a chat link. */
const WHATSAPP = String(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '').replace(/\D/g, '');

/**
 * Pincode check (UI + stub: there is no courier serviceability API, so it validates the format and
 * tells the shopper that exact delivery time is confirmed at checkout), the fit/model note,
 * payment trust line and return line shown beside Add to Cart.
 */
export function DeliveryAndTrust({ fit, productName }: { fit?: string; productName: string }) {
  const [pin, setPin] = useState('');
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const check = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      setResult({ ok: false, text: 'Enter a valid 6-digit pincode.' });
      return;
    }
    setResult({
      ok: true,
      text: `Pincode ${pin} noted. Delivery time and availability for your area are confirmed at checkout.`,
    });
  };

  return (
    <div className="space-y-4 text-[13px] text-[var(--charcoal)]">
      <form onSubmit={check} noValidate>
        <label htmlFor="pdp-pincode" className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--ink)]">
          <MapPin className="h-4 w-4" aria-hidden="true" /> Delivery
        </label>
        <div className="flex gap-2">
          <input
            id="pdp-pincode"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, '').slice(0, 6));
              setResult(null);
            }}
            placeholder="Enter pincode"
            aria-describedby={result ? 'pdp-pincode-result' : undefined}
            className="h-11 min-w-0 flex-1 border border-[#C3C3C3] bg-white px-3 text-[16px] text-[var(--ink)] outline-none focus:border-[var(--ink)]"
          />
          <button
            type="submit"
            className="h-11 shrink-0 border border-[var(--ink)] px-5 text-[13px] font-semibold uppercase tracking-[0.12em] text-[var(--ink)] transition-colors duration-200 hover:bg-[var(--ink)] hover:text-white"
          >
            Check
          </button>
        </div>
        {result && (
          <p id="pdp-pincode-result" role="status" className={`mt-2 ${result.ok ? 'text-[var(--charcoal)]' : 'text-[#B3261E]'}`}>
            {result.text}
          </p>
        )}
      </form>

      {fit && (
        <p className="flex items-start gap-2">
          <Ruler className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            <strong className="font-semibold text-[var(--ink)]">{fit} fit.</strong> Model is 6&apos;0&quot;, wears L.
          </span>
        </p>
      )}

      <p className="flex items-start gap-2">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>Secure checkout. Pay by UPI, card or net banking, or choose cash on delivery.</span>
      </p>
      <p className="text-[var(--soft)]">
        {RETURN_WINDOW_DAYS}-day returns on eligible items of {productName}. See the returns policy for details.
      </p>

      {WHATSAPP && (
        <a
          href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hi KOVENIK, I have a question about ${productName}.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center gap-2 font-semibold text-[var(--ink)] underline underline-offset-4"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" /> Questions? Chat on WhatsApp
        </a>
      )}
    </div>
  );
}
