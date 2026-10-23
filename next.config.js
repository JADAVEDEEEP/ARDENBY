/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a second dev server (e.g. for tests) run without clobbering `.next`.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  async headers() {
    // Baseline browser protections. A full Content-Security-Policy is deliberately
    // not set here: checkout loads Razorpay and Google scripts, so one needs to be
    // built and tested against those origins before it is switched on.
    const baseline = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ];
    const privateArea = [
      { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
      { key: 'Cache-Control', value: 'no-store' },
    ];

    return [
      { source: '/:path*', headers: baseline },
      { source: '/admin/:path*', headers: privateArea },
      { source: '/superadmin/:path*', headers: privateArea },
      { source: '/profile', headers: privateArea },
      { source: '/checkout', headers: privateArea },
      { source: '/orders/:path*', headers: privateArea },
    ];
  },
  webpack: (config, { dev }) => {
    // Windows: the persistent pack cache fails to rename files (EPERM/ENOENT),
    // leaving a stale cache that throws "Cannot read properties of undefined
    // (reading 'call')" / "app router not mounted" and stops all client JS.
    if (dev) config.cache = false;
    return config;
  },
};

module.exports = nextConfig;
