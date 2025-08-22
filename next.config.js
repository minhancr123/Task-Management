/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react']
  },
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Font optimization and error handling
  optimizeFonts: true,
  fontLoaders: [
    {
      loader: '@next/font/google',
      options: {
        subsets: ['latin'],
        display: 'swap',
        fallback: ['system-ui', 'arial'],
      },
    },
  ],
}

module.exports = nextConfig
