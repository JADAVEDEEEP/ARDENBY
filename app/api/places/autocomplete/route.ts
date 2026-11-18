import { NextRequest } from 'next/server';

import { OlaError, errorResponse, json, ola, parseCoords, throttled } from '@/lib/ola-server';

export const dynamic = 'force-dynamic';

type Prediction = {
  place_id?: string;
  description?: string;
  structured_formatting?: { main_text?: string; secondary_text?: string };
  geometry?: { location?: { lat?: number; lng?: number } };
};

// Address suggestions for what the customer types (GET /places/v1/autocomplete). When their position is
// known, results near it are preferred so "Safal" finds the Ahmedabad society before one in another state.
export async function GET(request: NextRequest) {
  if (throttled(request, 'autocomplete', 40)) return json({ success: false, error: 'rate-limited' }, 429);

  const { searchParams } = request.nextUrl;
  const q = (searchParams.get('q') ?? '').trim().replace(/\s+/g, ' ');
  if (q.length < 3 || q.length > 120) return json({ success: true, suggestions: [] });

  const params: Record<string, string> = { input: q, language: 'en' };
  const near = parseCoords(searchParams.get('lat'), searchParams.get('lng'));
  if (near) params.location = `${near.lat.toFixed(4)},${near.lng.toFixed(4)}`;

  try {
    const data = await ola<{ predictions?: Prediction[] }>('/places/v1/autocomplete', params, 5 * 60_000);
    const suggestions = (data.predictions ?? [])
      .filter((p) => p.place_id && p.geometry?.location?.lat != null && p.geometry.location.lng != null)
      .slice(0, 6)
      .map((p) => ({
        id: p.place_id!,
        name: (p.structured_formatting?.main_text ?? p.description ?? '').trim(),
        subtitle: (p.structured_formatting?.secondary_text ?? '').trim(),
        lat: Number(p.geometry!.location!.lat),
        lng: Number(p.geometry!.location!.lng),
      }))
      .filter((s) => s.name);
    return json({ success: true, suggestions });
  } catch (err) {
    if (err instanceof OlaError && err.kind === 'none') return json({ success: true, suggestions: [] });
    return errorResponse(err);
  }
}
