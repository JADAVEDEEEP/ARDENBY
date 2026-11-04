// Server-only helpers for the LocationIQ routes under app/api. The token lives only in
// LOCATIONIQ_ACCESS_TOKEN (never NEXT_PUBLIC_*) and is never returned to the browser or logged.
import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://us1.locationiq.com/v1';

export type LiqAddress = Record<string, string | undefined>;

export type Picked = {
  building: string;
  flat: string;
  area: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export const json = (body: object, status = 200, cacheControl = 'no-store') =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': cacheControl } });

export class LiqError extends Error {
  constructor(readonly kind: 'not-configured' | 'none' | 'rate-limited' | 'denied' | 'unavailable') {
    super(kind);
  }
}

export const errorResponse = (err: unknown) => {
  const kind = err instanceof LiqError ? err.kind : 'unavailable';
  const status = { 'not-configured': 503, none: 404, 'rate-limited': 429, denied: 502, unavailable: 502 }[kind];
  return json({ success: false, error: kind }, status);
};

// Small TTL cache so repeated lookups (same spot, same query) never reach LocationIQ twice.
type Entry = { at: number; value: unknown };
const cache = new Map<string, Entry>();
const CACHE_MAX = 500;

async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  const value = await load();
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
  cache.set(key, { at: Date.now(), value });
  return value;
}

/** GET a LocationIQ endpoint and parse its JSON. 404s and "Unable to geocode" become kind "none". */
export function liq<T>(path: string, params: Record<string, string>, ttlMs = 0): Promise<T> {
  const token = process.env.LOCATIONIQ_ACCESS_TOKEN;
  if (!token) return Promise.reject(new LiqError('not-configured'));

  const load = async () => {
    const url = new URL(`${BASE}${path}`);
    url.searchParams.set('key', token);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    let res: Response;
    try {
      res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    } catch {
      throw new LiqError('unavailable');
    }
    if (res.status === 404) throw new LiqError('none');
    if (res.status === 429) throw new LiqError('rate-limited');
    if (res.status === 401 || res.status === 403) throw new LiqError('denied');
    if (!res.ok) throw new LiqError('unavailable');
    const data = await res.json().catch(() => null);
    if (data == null || (!Array.isArray(data) && (data as { error?: string }).error)) throw new LiqError('none');
    return data as T;
  };

  // The token is part of no cache key.
  return ttlMs > 0 ? cached(`${path}?${JSON.stringify(params)}`, ttlMs, load) : load();
}

// Per-IP throttle so one visitor cannot burn the LocationIQ quota (free plan: 2 requests/second).
const hits = new Map<string, number[]>();

export function throttled(request: NextRequest, bucket: string, max: number, windowMs = 60_000) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > max;
}

export function parseCoords(rawLat: string | null, rawLng: string | null) {
  const lat = !rawLat || rawLat.trim() === '' ? NaN : Number(rawLat);
  const lng = !rawLng || rawLng.trim() === '' ? NaN : Number(rawLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

const unique = (parts: (string | undefined)[]) =>
  parts.map((p) => p?.trim() ?? '').filter((p, i, all) => Boolean(p) && all.indexOf(p) === i);

const first = (a: LiqAddress, ...keys: string[]) => {
  for (const key of keys) {
    const value = a[key]?.trim();
    if (value) return value;
  }
  return '';
};

// OSM often tags a locality as town/village (Paldi, Navrangpura), so those rank below the district,
// which is the real city for urban Gujarat addresses. Talukas ("county") are never used.
const pickCity = (a: LiqAddress) =>
  first(a, 'city', 'municipality') ||
  first(a, 'state_district').replace(/\s+district$/i, '') ||
  first(a, 'town', 'village');

/**
 * Maps a LocationIQ address onto the form. `placeName` is the building / society name, supplied only
 * when the customer picked a specific place; it is kept apart from the area and never inferred.
 */
export function mapAddress(a: LiqAddress, placeName = ''): Picked {
  const building = placeName.trim();
  const lower = building.toLowerCase();
  const city = pickCity(a);
  return {
    building,
    // House number only. Never derived from coordinates.
    flat: first(a, 'house_number'),
    area: unique([
      a.road,
      first(a, 'neighbourhood', 'quarter'),
      first(a, 'suburb', 'residential', 'city_district'),
    ])
      .filter((part) => part.toLowerCase() !== lower)
      .join(', '),
    // LocationIQ has no reliable "nearby landmark" field, so this is left for the customer.
    landmark: '',
    city,
    // OSM omits the state for Delhi; the city name is enough to say which it is.
    state: first(a, 'state') || (/^(new )?delhi$/i.test(city) ? 'Delhi' : ''),
    pincode: (a.postcode ?? '').replace(/\D/g, '').slice(0, 6),
    country: first(a, 'country'),
  };
}
