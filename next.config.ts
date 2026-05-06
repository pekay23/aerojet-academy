import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 80, 90],
    minimumCacheTTL: 3600,
    remotePatterns: [
      { protocol: 'https', hostname: 'utfs.io' },
      { protocol: 'https', hostname: 'uploadthing.com' },
      { protocol: 'https', hostname: 'gx1g03nvpo.ufs.sh' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'lightpink-guanaco-745322.hostingersite.com' },
      { protocol: 'https', hostname: '*.ufs.sh' },
    ],
  },
  allowedDevOrigins: ['192.168.8.173'],
  serverExternalPackages: ['ws'],
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
      allowedOrigins: [
        'localhost:3000',
        ...(process.env.EXTRA_ALLOWED_ORIGINS?.split(',').filter(Boolean) || []),
      ],
    },
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self';",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/courses/four-year-b1-b2',
        destination: '/courses/aircraft-engineering/easa-part-66/four-year-b1-b2',
        permanent: true,
      },
      {
        source: '/courses/two-year-b1',
        destination: '/courses/aircraft-engineering/easa-part-66/two-year-b1',
        permanent: true,
      },
      {
        source: '/courses/modular-training',
        destination: '/courses/aircraft-engineering/easa-part-66/modular-training',
        permanent: true,
      },
      {
        source: '/courses/exam-only',
        destination: '/courses/aircraft-engineering/easa-part-66/exam-only',
        permanent: true,
      },
      {
        source: '/courses/military-certification',
        destination: '/courses/aircraft-engineering/easa-part-66/military-certification',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
