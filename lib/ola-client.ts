// Browser-side helper for our own /api/places/validate route (Ola Maps Address Validation).

/**
 * Asks Ola whether the typed address matches the pincode. Returns an error message ONLY when Ola matched
 * the address and found a different pincode. If the service is down, rate-limited, or cannot match the
 * address, this returns null so a customer with a real (e.g. rural) address is never blocked by it; the
 * required-field and 6-digit pincode checks stay with the forms.
 */
export async function pincodeMismatch(parts: { address: string; city: string; state: string; pincode: string }): Promise<string | null> {
  const full = [parts.address, parts.city, parts.state, parts.pincode].map((p) => p.trim()).filter(Boolean).join(', ');
  try {
    const res = await fetch(`/api/places/validate?${new URLSearchParams({ address: full })}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    });
    const body = (await res.json().catch(() => null)) as { success?: boolean; validated?: boolean; pincode?: string } | null;
    if (!res.ok || !body?.success) {
      if (res.status !== 404) console.error(`[address] validation unavailable: HTTP ${res.status}`);
      return null;
    }
    if (body.validated && body.pincode && body.pincode !== parts.pincode.trim()) {
      return `This area looks like pincode ${body.pincode}, not ${parts.pincode.trim()}. Please check it.`;
    }
    return null;
  } catch (err) {
    console.error('[address] validation request failed:', err);
    return null;
  }
}
