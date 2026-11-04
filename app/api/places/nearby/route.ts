import { NextRequest } from 'next/server';

import { LiqAddress, LiqError, errorResponse, json, liq, parseCoords, throttled } from '@/lib/locationiq-server';

export const dynamic = 'force-dynamic';

type NearbyItem = {
  name?: string;
  class?: string;
  type?: string;
  distance?: number;
  lat?: string;
  lon?: string;
  osm_type?: string;
  osm_id?: string;
  address?: LiqAddress;
};

// Place types that only name an area, not a building the customer could live in.
const AREA_ONLY = new Set(['suburb', 'neighbourhood', 'quarter', 'city', 'town', 'village', 'hamlet', 'city_block', 'district', 'borough']);

// Structures nobody receives a delivery in.
const NOT_DELIVERABLE = new Set(['industrial', 'service', 'transformer_tower', 'garage', 'garages', 'roof', 'shed', 'hut', 'toilets', 'train_station', 'transportation']);

const label = (value: string) => value.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

function kindOf(cls: string, type: string) {
  if (cls === 'landuse' && type === 'residential') return 'Residential society';
  if (cls === 'place') return 'Residential area';
  if (['house', 'detached', 'semidetached_house', 'bungalow', 'villa'].includes(type)) return 'House / bungalow';
  if (['apartments', 'residential', 'dormitory'].includes(type)) return 'Apartments';
  if (cls === 'building' && type === 'yes') return 'Building';
  return label(type) || 'Place';
}

// Named buildings, societies and landmarks around a point, nearest first.
export async function GET(request: NextRequest) {
  if (throttled(request, 'nearby', 20)) return json({ success: false, error: 'rate-limited' }, 429);

  const { searchParams } = request.nextUrl;
  const coords = parseCoords(searchParams.get('lat'), searchParams.get('lng'));
  if (!coords) return json({ success: false, error: 'invalid-coordinates' }, 400);

  try {
    const data = await liq<NearbyItem[]>(
      '/nearby',
      {
        lat: coords.lat.toFixed(5),
        lon: coords.lng.toFixed(5),
        tag: 'landuse,building,place,leisure,office,tourism',
        radius: '400',
        format: 'json',
        'accept-language': 'en',
      },
      10 * 60_000,
    );

    const seen = new Set<string>();
    const places = data
      .filter((p) => {
        const name = p.name?.trim() ?? '';
        if (name.length < 3 || /^[\d\s-]+$/.test(name) || !p.osm_type || !p.osm_id) return false;
        if (p.class === 'building' && NOT_DELIVERABLE.has(p.type ?? '')) return false;
        if (/substation|transformer/i.test(name)) return false;
        if (p.class === 'place' && AREA_ONLY.has(p.type ?? '')) return false;
        if (p.class === 'landuse' && p.type !== 'residential') return false;
        const key = name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
      .slice(0, 12)
      .map((p) => ({
        id: `${p.osm_type![0].toUpperCase()}${p.osm_id}`,
        name: p.name!.trim(),
        kind: kindOf(p.class ?? '', p.type ?? ''),
        distance: Math.round(p.distance ?? 0),
        lat: Number(p.lat),
        lng: Number(p.lon),
        subtitle: [p.address?.road, p.address?.suburb].filter(Boolean).join(', '),
      }));

    return json({ success: true, places });
  } catch (err) {
    // No named place nearby is a normal outcome, not an error.
    if (err instanceof LiqError && err.kind === 'none') return json({ success: true, places: [] });
    return errorResponse(err);
  }
}
