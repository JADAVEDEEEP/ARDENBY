import { NextRequest } from 'next/server';

import { OlaComponent, errorResponse, json, mapOlaAddress, ola, parseCoords, throttled } from '@/lib/ola-server';

export const dynamic = 'force-dynamic';

type Result = { formatted_address?: string; name?: string; types?: string[]; address_components?: OlaComponent[] };

// Reverse geocoding through Ola Maps (GET /places/v1/reverse-geocode?latlng=lat,lng). Coordinates are rounded
// to ~1 m for the cache so repeat lookups from the same spot are free.
export async function GET(request: NextRequest) {
  if (throttled(request, 'reverse', 20)) return json({ success: false, error: 'rate-limited' }, 429);

  const { searchParams } = request.nextUrl;
  const coords = parseCoords(searchParams.get('lat'), searchParams.get('lng'));
  if (!coords) return json({ success: false, error: 'invalid-coordinates' }, 400);

  try {
    const data = await ola<{ results?: Result[] }>(
      '/places/v1/reverse-geocode',
      { latlng: `${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`, language: 'en' },
      10 * 60_000,
    );
    // Nearest result that carries a pincode; Ola lists shops and stops too, so plain addresses are preferred.
    const withPin = (data.results ?? []).filter((r) => r.address_components?.some((c) => c.types?.includes('postal_code')));
    const best = withPin.find((r) => !r.types?.length) ?? withPin[0];
    if (!best) return json({ success: false, error: 'none' }, 404);
    const poi = best.types?.length ? (best.name ?? '') : '';
    return json({ success: true, address: mapOlaAddress(best.address_components, best.formatted_address ?? '', '', poi) });
  } catch (err) {
    return errorResponse(err);
  }
}
