import { NextRequest } from 'next/server';

import { LiqAddress, LiqError, errorResponse, json, liq, mapAddress, parseCoords, throttled } from '@/lib/locationiq-server';

export const dynamic = 'force-dynamic';

type LookupItem = { lat?: string; lon?: string; address?: LiqAddress };

// Place Details: the complete address and coordinates for a suggestion or nearby place the customer
// picked. `name` is the building / society name they chose; it is returned as `building` unchanged.
export async function GET(request: NextRequest) {
  if (throttled(request, 'details', 30)) return json({ success: false, error: 'rate-limited' }, 429);

  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id') ?? '';
  const name = (searchParams.get('name') ?? '').slice(0, 120);
  if (!/^[NWR]\d{1,15}$/.test(id)) return json({ success: false, error: 'invalid-id' }, 400);

  try {
    let rows: LookupItem[] = [];
    try {
      rows = await liq<LookupItem[]>(
        '/lookup',
        { osm_ids: id, format: 'json', addressdetails: '1', 'accept-language': 'en' },
        60 * 60_000,
      );
    } catch (err) {
      if (!(err instanceof LiqError && err.kind === 'none')) throw err;
    }

    let row = rows[0];
    // Lookup has no record: fall back to the address at the place's own coordinates.
    if (!row?.address) {
      const coords = parseCoords(searchParams.get('lat'), searchParams.get('lng'));
      if (!coords) return json({ success: false, error: 'none' }, 404);
      const rev = await liq<LookupItem>(
        '/reverse',
        { lat: coords.lat.toFixed(5), lon: coords.lng.toFixed(5), format: 'json', addressdetails: '1', zoom: '18', 'accept-language': 'en' },
        10 * 60_000,
      );
      row = { ...rev, lat: String(coords.lat), lon: String(coords.lng) };
    }
    if (!row.address) return json({ success: false, error: 'none' }, 404);

    return json({
      success: true,
      address: mapAddress(row.address, name),
      lat: Number(row.lat),
      lng: Number(row.lon),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
