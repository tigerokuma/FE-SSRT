/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },

  async rewrites() {
    // Use BACKEND_API_BASE if set, otherwise default to localhost for development
    const base = (process.env.BACKEND_API_BASE || 'http://localhost:3000').replace(/\/$/, '');
    if (!base) {
      console.warn('[next.config] BACKEND_API_BASE not set — no rewrites applied.');
      return [];
    }
    return [
      // main proxy: /api/backend/* -> {BACKEND_API_BASE}/*
      { source: '/api/backend/:path*', destination: `${base}/:path*` },
    ];
  },
};

export default nextConfig;
