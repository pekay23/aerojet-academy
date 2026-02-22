import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'utfs.io' },
      { protocol: 'https', hostname: 'uploadthing.com' },
      { protocol: 'https', hostname: 'gx1g03nvpo.ufs.sh' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'lightpink-guanaco-745322.hostingersite.com' },
      { protocol: 'https', hostname: '*.ufs.sh' },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
      allowedOrigins: ['localhost:3000', '*.ngrok-free.dev', '*.ngrok-free.app'],
    },
  },
  typescript: {
    ignoreBuildErrors: false,
  },
}

export default nextConfig
