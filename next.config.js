/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Enable ESLint during builds - all issues have been fixed
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Enable TypeScript checking during builds
    ignoreBuildErrors: false,
  },
  // Enable React strict mode
  reactStrictMode: true,
  // Production optimizations
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Image optimization for production
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  // Performance optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig
