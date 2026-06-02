/**
 * Derive a next/image remotePattern from STRAPI_MEDIA_URL / STRAPI_BASE_URL
 * so whatever origin actually serves Strapi media is always allowed,
 * regardless of how the server is configured at deploy time.
 * @returns {import('next').NextConfig['images']['remotePatterns']}
 */
function strapiRemotePatterns() {
  const origin = process.env.STRAPI_MEDIA_URL || process.env.STRAPI_BASE_URL;
  if (!origin) return [];
  try {
    const u = new URL(origin);
    return [
      {
        protocol: u.protocol.replace(':', ''),
        hostname: u.hostname,
        ...(u.port ? { port: u.port } : {}),
        pathname: '/uploads/**',
      },
    ];
  } catch {
    return [];
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Emit a self-contained server bundle (.next/standalone) so the Docker
  // runtime image only needs `node server.js` + the static assets.
  output: 'standalone',
  // Don't let ESLint style rules (e.g. no-explicit-any in the Strapi typing
  // layer) fail the production build. Lint still runs via `npm run lint`.
  eslint: { ignoreDuringBuilds: true },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 640, 750, 828, 1080, 1200, 1440, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Strapi serves locally-uploaded media from <PUBLIC_URL>/uploads. Allow
    // next/image to optimise those. The host derives from STRAPI_MEDIA_URL /
    // STRAPI_BASE_URL when set, so this stays in sync with the CMS origin
    // without a manual edit; the static entries are belt-and-braces for the
    // current VPS IP and the production domain (http + https).
    remotePatterns: [
      ...strapiRemotePatterns(),
      { protocol: 'http', hostname: '37.60.225.220', port: '1337', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'inspireafricans.com', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'cms.inspireafricans.com', pathname: '/uploads/**' },
      { protocol: 'http', hostname: 'localhost', port: '1337', pathname: '/uploads/**' },
    ],
  },
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
    ];
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
