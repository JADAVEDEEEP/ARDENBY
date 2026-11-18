import { NextRequest } from 'next/server';

import { errorResponse, json, ola, throttled } from '@/lib/ola-server';

export const dynamic = 'force-dynamic';

type Component = Record<string, { componentName?: string; componentStatus?: string }>;
type Validation = { result?: { validated?: boolean; validated_address?: string; address_components?: Component[] }; status?: string };

// Address Validation (GET /places/v1/addressvalidation?address=). Returns whether Ola could match the address
// and the pincode it matched, so the form can flag a pincode that does not belong to the typed area.
// Response fields were confirmed against the live API; the docs page does not list them.
export async function GET(request: NextRequest) {
  if (throttled(request, 'validate', 15)) return json({ success: false, error: 'rate-limited' }, 429);

  const address = (request.nextUrl.searchParams.get('address') ?? '').trim().replace(/\s+/g, ' ').slice(0, 300);
  if (address.length < 8) return json({ success: false, error: 'invalid-address' }, 400);

  try {
    const data = await ola<Validation>('/places/v1/addressvalidation', { address }, 10 * 60_000);
    const result = data.result;
    const matched = (type: string) =>
      result?.address_components?.map((c) => c[type]).find(Boolean)?.componentName?.trim() ?? '';
    return json({
      success: true,
      validated: result?.validated === true,
      pincode: matched('postalcode').replace(/\D/g, '').slice(0, 6),
      city: matched('locality'),
      state: matched('region'),
      formatted: result?.validated_address ?? '',
    });
  } catch (err) {
    return errorResponse(err);
  }
}
