import { NextRequest, NextResponse } from 'next/server';

import { OLA_HOST, olaToken, throttled } from '@/lib/ola-server';

export const dynamic = 'force-dynamic';

// Map proxy: the browser map asks for ?u=<Ola tile / style / font / sprite URL>; the OAuth token is added here,
// on the server, so no credential reaches the browser. Only Ola's own /tiles/ paths are allowed (no open proxy).
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('u') ?? '';
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (`${target.protocol}//${target.host}` !== OLA_HOST || !target.pathname.startsWith('/tiles/') || target.pathname.includes('..')) {
    return new NextResponse(null, { status: 400 });
  }
  target.searchParams.delete('api_key'); // never forward a key; the bearer token is used instead
  if (throttled(request, 'ola-map', 1500)) return new NextResponse(null, { status: 429 });

  try {
    let token: string;
    try {
      token = await olaToken();
    } catch {
      return new NextResponse(null, { status: 503 });
    }
    const fetchOnce = (t: string) => fetch(target, { headers: { Authorization: `Bearer ${t}` }, signal: AbortSignal.timeout(10000) });
    let res = await fetchOnce(token);
    if (res.status === 401) res = await fetchOnce(await olaToken(true));
    if (!res.ok) {
      if (res.status !== 404) console.error(`[ola-map] ${res.status} for ${target.pathname} (401/403 = credentials rejected or Maps APIs not enabled, 429 = quota).`);
      return new NextResponse(null, { status: res.status === 404 ? 404 : 502 });
    }
    const isStyle = target.pathname.endsWith('.json');
    return new NextResponse(await res.arrayBuffer(), {
      headers: {
        'Content-Type': res.headers.get('content-type') ?? 'application/octet-stream',
        'Cache-Control': `public, max-age=${isStyle ? 3600 : 86400}, s-maxage=${isStyle ? 3600 : 86400}`,
      },
    });
  } catch (err) {
    console.error('[ola-map] network error:', (err as Error).message);
    return new NextResponse(null, { status: 502 });
  }
}
