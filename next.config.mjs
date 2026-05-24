/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Emit a self-contained server bundle (.next/standalone) so the Docker
  // runtime image only needs `node server.js` + the static assets.
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 640, 750, 828, 1080, 1200, 1440, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Strapi serves locally-uploaded media from <PUBLIC_URL>/uploads. Allow
    // next/image to optimise those. Update the host if the server IP/domain
    // changes (keep it in sync with the CMS PUBLIC_URL).
    remotePatterns: [
      { protocol: 'http', hostname: '37.60.225.220', port: '1337', pathname: '/uploads/**' },
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
