import { NextRequest, NextResponse } from 'next/server';

import { throttled } from '@/lib/locationiq-server';

export const dynamic = 'force-dynamic';

// Map tile proxy: the browser asks us for tiles, and the LocationIQ token is added here, on the server.
export async function GET(request: NextRequest, { params }: { params: { z: string; x: string; y: string } }) {
  const token = process.env.LOCATIONIQ_ACCESS_TOKEN;
  const y = params.y.replace(/\.png$/, '');
  if (!token || ![params.z, params.x, y].every((n) => /^\d{1,8}$/.test(n)) || Number(params.z) > 19) {
    return new NextResponse(null, { status: 400 });
  }
  if (throttled(request, 'tiles', 600)) return new NextResponse(null, { status: 429 });

  try {
    const res = await fetch(`https://a-tiles.locationiq.com/v3/streets/r/${params.z}/${params.x}/${y}.png?key=${token}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return new NextResponse(null, { status: res.status === 404 ? 404 : 502 });
    return new NextResponse(await res.arrayBuffer(), {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400, s-maxage=86400' },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
