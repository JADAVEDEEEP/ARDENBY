import { NextRequest } from 'next/server';

import { LiqError, errorResponse, json, liq, throttled } from '@/lib/locationiq-server';

export const dynamic = 'force-dynamic';

type AutoItem = {
  osm_type?: string;
  osm_id?: string;
  lat?: string;
  lon?: string;
  display_place?: string;
  display_address?: string;
};

// Address suggestions for what the customer types. When their position is known, results near it
// are preferred (but not forced) so "Safal" finds the Ahmedabad society before one in another state.
export async function GET(request: NextRequest) {
  if (throttled(request, 'autocomplete', 40)) return json({ success: false, error: 'rate-limited' }, 429);

  const { searchParams } = request.nextUrl;
  const q = (searchParams.get('q') ?? '').trim().replace(/\s+/g, ' ');
  if (q.length < 3 || q.length > 120) return json({ success: true, suggestions: [] });

  const params: Record<string, string> = {
    q,
    countrycodes: 'in',
    limit: '6',
    dedupe: '1',
    addressdetails: '1',
    'accept-language': 'en',
  };
  const rawLat = searchParams.get('lat');
  const lat = Number(rawLat);
  const lng = Number(searchParams.get('lng'));
  if (rawLat && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    // viewbox is left,top,right,bottom (~35 km around the customer); bounded stays off.
    params.viewbox = [lng - 0.3, lat + 0.3, lng + 0.3, lat - 0.3].map((n) => n.toFixed(2)).join(',');
  }

  try {
    const data = await liq<AutoItem[]>('/autocomplete', params, 5 * 60_000);
    const suggestions = data
      .filter((r) => r.osm_type && r.osm_id && r.lat && r.lon)
      .map((r) => ({
        id: `${r.osm_type![0].toUpperCase()}${r.osm_id}`,
        name: (r.display_place ?? '').trim(),
        subtitle: (r.display_address ?? '').trim(),
        lat: Number(r.lat),
        lng: Number(r.lon),
      }))
      .filter((s) => s.name);
    return json({ success: true, suggestions });
  } catch (err) {
    if (err instanceof LiqError && err.kind === 'none') return json({ success: true, suggestions: [] });
    return errorResponse(err);
  }
}
