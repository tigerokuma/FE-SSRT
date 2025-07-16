/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    // API base URL - defaults to remote, falls back to localhost
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://34.94.83.163:3000'
    
    return [
      {
        source: '/api/backend/:path*',
        destination: `${apiBaseUrl}/:path*`,
      },
    ]
  },
}

export default nextConfig
