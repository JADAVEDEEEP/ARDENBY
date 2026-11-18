import { NextRequest } from 'next/server';

import { OlaError, errorResponse, json, ola, parseCoords, throttled } from '@/lib/ola-server';

export const dynamic = 'force-dynamic';

type Prediction = {
  place_id?: string;
  types?: string[];
  distance_meters?: number;
  structured_formatting?: { main_text?: string; secondary_text?: string };
};

const label = (value: string) => value.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

// Ola tags buildings loosely, so only the type families a customer could live in get a specific label.
function kindOf(types: string[]) {
  if (types.includes('premise') || types.includes('subpremise')) return 'Apartments';
  if (types.includes('street_address')) return 'House / bungalow';
  if (types.includes('neighborhood') || types.includes('sublocality')) return 'Residential area';
  return types[0] ? label(types[0]) : 'Place';
}

// Types that are never a delivery address.
const NOT_DELIVERABLE = new Set(['airport', 'bus_station', 'transit_station', 'train_station', 'gas_station', 'atm', 'parking']);

// Named buildings, societies and landmarks around a point, nearest first (GET /places/v1/nearbysearch).
// Results carry no coordinates; the details route supplies them when the customer picks one.
export async function GET(request: NextRequest) {
  if (throttled(request, 'nearby', 20)) return json({ success: false, error: 'rate-limited' }, 429);

  const { searchParams } = request.nextUrl;
  const coords = parseCoords(searchParams.get('lat'), searchParams.get('lng'));
  if (!coords) return json({ success: false, error: 'invalid-coordinates' }, 400);

  try {
    const data = await ola<{ predictions?: Prediction[] }>(
      '/places/v1/nearbysearch',
      { layers: 'venue', location: `${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`, radius: '400', language: 'en' },
      10 * 60_000,
    );

    const seen = new Set<string>();
    const places = (data.predictions ?? [])
      .filter((p) => {
        const name = p.structured_formatting?.main_text?.trim() ?? '';
        if (!p.place_id || name.length < 3 || /^[\d\s-]+$/.test(name)) return false;
        if ((p.types ?? []).some((t) => NOT_DELIVERABLE.has(t))) return false;
        const key = name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => (a.distance_meters ?? 0) - (b.distance_meters ?? 0))
      .slice(0, 12)
      .map((p) => ({
        id: p.place_id!,
        name: p.structured_formatting!.main_text!.trim(),
        kind: kindOf(p.types ?? []),
        distance: Math.round(p.distance_meters ?? 0),
        lat: 0,
        lng: 0,
        subtitle: (p.structured_formatting?.secondary_text ?? '').split(',').slice(0, 2).join(',').trim(),
      }));

    return json({ success: true, places });
  } catch (err) {
    // No named place nearby is a normal outcome, not an error.
    if (err instanceof OlaError && err.kind === 'none') return json({ success: true, places: [] });
    return errorResponse(err);
  }
}
