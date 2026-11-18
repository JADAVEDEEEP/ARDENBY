// Server-only helpers for the Ola Maps routes under app/api. Credentials live only in
// OLA_MAPS_CLIENT_ID / OLA_MAPS_CLIENT_SECRET (never NEXT_PUBLIC_*). They are exchanged for a short-lived
// OAuth bearer token on the server, so no key ever reaches the browser or needs a domain allow-list.
// Endpoints and auth follow https://maps.olakrutrim.com/docs (auth, places-apis, geocoding, maps).
import { NextRequest, NextResponse } from 'next/server';

export const OLA_HOST = 'https://api.olamaps.io';

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

export class OlaError extends Error {
  constructor(readonly kind: 'not-configured' | 'none' | 'rate-limited' | 'denied' | 'unavailable') {
    super(kind);
  }
}

export const errorResponse = (err: unknown) => {
  const kind = err instanceof OlaError ? err.kind : 'unavailable';
  const status = { 'not-configured': 503, none: 404, 'rate-limited': 429, denied: 502, unavailable: 502 }[kind];
  return json({ success: false, error: kind }, status);
};

// ---- OAuth token ------------------------------------------------------------------------------
let tokenCache: { value: string; expiresAt: number } | null = null;
let tokenInFlight: Promise<string> | null = null;

/** Reads the `exp` claim (seconds) from the JWT so the cache never outlives the token. */
function expiryOf(jwt: string): number {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8')) as { exp?: number };
    if (payload.exp) return payload.exp * 1000;
  } catch {
    /* fall through to the default */
  }
  return Date.now() + 30 * 60_000;
}

async function fetchToken(): Promise<string> {
  const clientId = process.env.OLA_MAPS_CLIENT_ID?.trim();
  const clientSecret = process.env.OLA_MAPS_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    console.error('[ola] OLA_MAPS_CLIENT_ID / OLA_MAPS_CLIENT_SECRET are not set. Add them in Vercel → Settings → Environment Variables and redeploy.');
    throw new OlaError('not-configured');
  }
  let res: Response;
  try {
    res = await fetch(`${OLA_HOST}/auth/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', scope: 'openid', client_id: clientId, client_secret: clientSecret }),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    console.error('[ola] network error getting an access token:', (err as Error).message);
    throw new OlaError('unavailable');
  }
  if (res.status === 401 || res.status === 400 || res.status === 403) {
    console.error(`[ola] token request rejected (${res.status}): the client id/secret are wrong, revoked, or the plan is not active.`);
    throw new OlaError('denied');
  }
  if (res.status === 429) {
    console.error('[ola] 429 on the token request (rate limit).');
    throw new OlaError('rate-limited');
  }
  const body = (await res.json().catch(() => null)) as { access_token?: string } | null;
  if (!res.ok || !body?.access_token) {
    console.error(`[ola] unexpected token response (${res.status}).`);
    throw new OlaError('unavailable');
  }
  tokenCache = { value: body.access_token, expiresAt: expiryOf(body.access_token) };
  return body.access_token;
}

/** A valid bearer token, refreshed 2 minutes before expiry; concurrent callers share one request. */
export async function olaToken(force = false): Promise<string> {
  if (!force && tokenCache && tokenCache.expiresAt - Date.now() > 120_000) return tokenCache.value;
  tokenInFlight ??= fetchToken().finally(() => {
    tokenInFlight = null;
  });
  return tokenInFlight;
}

// ---- JSON calls -------------------------------------------------------------------------------
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

/** GET an Ola Maps JSON endpoint. 404 becomes kind "none"; 401/403 refresh the token once, then "denied". */
export function ola<T>(path: string, params: Record<string, string>, ttlMs = 0): Promise<T> {
  const load = async (): Promise<T> => {
    const url = new URL(`${OLA_HOST}${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

    for (let attempt = 0; attempt < 2; attempt++) {
      const token = await olaToken(attempt > 0);
      let res: Response;
      try {
        res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(8000) });
      } catch (err) {
        console.error(`[ola] network error calling ${path}:`, (err as Error).message);
        throw new OlaError('unavailable');
      }
      if (res.status === 401 && attempt === 0) continue; // expired token: fetch a fresh one and retry once
      if (res.status === 404) throw new OlaError('none');
      if (res.status === 429) {
        console.error(`[ola] 429 on ${path}: monthly/minute rate limit reached.`);
        throw new OlaError('rate-limited');
      }
      if (res.status === 401 || res.status === 403) {
        console.error(`[ola] ${res.status} on ${path}: credentials rejected or this API is not enabled on the Ola Maps plan.`);
        throw new OlaError('denied');
      }
      if (!res.ok) {
        console.error(`[ola] unexpected ${res.status} from ${path}`);
        throw new OlaError('unavailable');
      }
      const data = (await res.json().catch(() => null)) as T | null;
      if (data == null) throw new OlaError('unavailable');
      return data;
    }
    throw new OlaError('denied');
  };
  return ttlMs > 0 ? cached(`${path}?${JSON.stringify(params)}`, ttlMs, load) : load();
}

// ---- Per-IP throttle --------------------------------------------------------------------------
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

/** Place ids look like `ola-platform:6000089087548`. */
export const isPlaceId = (id: string) => /^ola-platform:[A-Za-z0-9_-]{1,40}$/.test(id);

// ---- Address mapping --------------------------------------------------------------------------
export type OlaComponent = { long_name?: string; short_name?: string; types?: string[] };

const comp = (list: OlaComponent[] | undefined, ...types: string[]) => {
  for (const type of types) {
    const hit = list?.find((c) => c.types?.includes(type) && c.long_name?.trim());
    if (hit) return hit.long_name!.trim();
  }
  return '';
};

const unique = (parts: string[]) => parts.filter((p, i, all) => Boolean(p) && all.indexOf(p) === i);
const sameText = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Maps an Ola place onto the form. The formatted address is split into its parts: pincode, city, state and
 * country are removed, a leading house number becomes `flat`, and what remains is the street / area.
 * `placeName` is the building the customer picked; it is returned as `building` and kept out of `area`.
 */
export function mapOlaAddress(components: OlaComponent[] | undefined, formatted: string, placeName = '', dropFirstIf = ''): Picked {
  const state = comp(components, 'administrative_area_level_1');
  const city = comp(components, 'locality') || comp(components, 'administrative_area_level_2').replace(/\s+district$/i, '');
  const pincode = comp(components, 'postal_code').replace(/\D/g, '').slice(0, 6);
  const country = comp(components, 'country') || 'India';
  const building = placeName.trim();

  const known = [city, state, country, pincode, comp(components, 'administrative_area_level_2'), comp(components, 'administrative_area_level_3')];
  let parts = formatted
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !known.some((k) => k && sameText(p, k)))
    .filter((p) => !/\b(taluka|tehsil|district)$/i.test(p))
    .filter((p) => !/^\d{6}$/.test(p));
  // Reverse geocoding can return a shop or stop; its own name is not part of the delivery address.
  if (dropFirstIf && parts[0] && sameText(parts[0], dropFirstIf)) parts = parts.slice(1);
  if (building) parts = parts.filter((p) => !sameText(p, building));

  let flat = '';
  if (parts[0] && /^\d+[A-Za-z]?([/-]\d+[A-Za-z]?)?$/.test(parts[0])) flat = parts.shift()!;

  return {
    building,
    flat,
    area: unique(parts).join(', '),
    // Ola has no reliable "nearby landmark" field, so this is left for the customer.
    landmark: '',
    city,
    state,
    pincode,
    country,
  };
}
