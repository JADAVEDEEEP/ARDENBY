import { NextRequest } from 'next/server';

import { LiqAddress, errorResponse, json, liq, mapAddress, parseCoords, throttled } from '@/lib/locationiq-server';

export const dynamic = 'force-dynamic';

// Reverse geocoding through LocationIQ. Coordinates are rounded to ~1 m for the cache so repeat
// lookups from the same spot are free.
export async function GET(request: NextRequest) {
  if (throttled(request, 'reverse', 20)) return json({ success: false, error: 'rate-limited' }, 429);

  const { searchParams } = request.nextUrl;
  const coords = parseCoords(searchParams.get('lat'), searchParams.get('lng'));
  if (!coords) return json({ success: false, error: 'invalid-coordinates' }, 400);

  try {
    const data = await liq<{ address?: LiqAddress }>(
      '/reverse',
      {
        lat: coords.lat.toFixed(5),
        lon: coords.lng.toFixed(5),
        format: 'json',
        addressdetails: '1',
        zoom: '18',
        'accept-language': 'en',
      },
      10 * 60_000,
    );
    if (!data.address) return json({ success: false, error: 'none' }, 404);
    return json({ success: true, address: mapAddress(data.address) });
  } catch (err) {
    return errorResponse(err);
  }
}
