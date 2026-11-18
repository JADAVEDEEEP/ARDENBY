import { NextRequest } from 'next/server';

import { OlaComponent, errorResponse, isPlaceId, json, mapOlaAddress, ola, throttled } from '@/lib/ola-server';

export const dynamic = 'force-dynamic';

type Details = {
  result?: {
    formatted_address?: string;
    name?: string;
    types?: string[];
    address_components?: OlaComponent[];
    geometry?: { location?: { lat?: number; lng?: number } };
  };
};

// Place Details (GET /places/v1/details?place_id=): the complete address and coordinates for a suggestion or
// nearby place the customer picked. A plain street address ("36, Krishna Bunglows Rd") is split into house
// number and street; a named place (society, building) is returned as `building`.
export async function GET(request: NextRequest) {
  if (throttled(request, 'details', 30)) return json({ success: false, error: 'rate-limited' }, 429);

  const { searchParams } = request.nextUrl;
  const id = searchParams.get('id') ?? '';
  const name = (searchParams.get('name') ?? '').trim().slice(0, 120);
  if (!isPlaceId(id)) return json({ success: false, error: 'invalid-id' }, 400);

  try {
    const { result } = await ola<Details>('/places/v1/details', { place_id: id, language: 'en' }, 60 * 60_000);
    const loc = result?.geometry?.location;
    if (!result || loc?.lat == null || loc.lng == null) return json({ success: false, error: 'none' }, 404);

    // A name that starts with a house number or ends in a road word is a street address, not a building.
    const isStreet = /^\d/.test(name) || /\b(rd|road|marg|street|st|lane|path|highway|hwy)\.?$/i.test(name);
    return json({
      success: true,
      address: mapOlaAddress(result.address_components, result.formatted_address ?? '', isStreet ? '' : name),
      lat: Number(loc.lat),
      lng: Number(loc.lng),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
