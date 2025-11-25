/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },

  // Rewrites commented out - using API route handler instead (app/api/backend/[[...path]]/route.ts)
  // The route handler handles authentication and proxying to backend
  // async rewrites() {
  //   const base = (process.env.BACKEND_API_BASE || 'http://localhost:3000').replace(/\/$/, '');
  //   if (!base) {
  //     console.warn('[next.config] BACKEND_API_BASE not set — no rewrites applied.');
  //     return [];
  //   }
  //   return [
  //     { source: '/api/backend/:path*', destination: `${base}/:path*` },
  //   ];
  // },
};

export default nextConfig;
