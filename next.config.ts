import type { NextConfig } from 'next'

const isVercel = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_VERCEL_ENV !== undefined

const nextConfig: NextConfig = {
  ...(isVercel ? {} : { output: 'standalone' }),
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
    localPatterns: [
      { pathname: '/api/images/proxy' },
      { pathname: '/api/images/transform' },
      { pathname: '/images/**' },
      { pathname: '/apple-touch-icon.webp' },
      { pathname: '/favicon.webp' },
      { pathname: '/favicon.ico' },
    ],
  },
  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: [
      '192.168.8.202',
      '192.168.8.173',
      '192.168.100.218',
      '192.168.100.243',
      '192.168.8.77',
    ],
  }),
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
    const isDev = process.env.NODE_ENV === 'development'
    const headers = [
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
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
    ]

    // Skip strict CSP in development so images load over local network
    if (!isDev) {
      headers.push({
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' https://js.stripe.com https://uploadthing.com https://www.google.com https://www.gstatic.com https://va.vercel-scripts.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "img-src 'self' data: blob: https://utfs.io https://*.ufs.sh https://uploadthing.com https://lh3.googleusercontent.com https://flagcdn.com https://www.gstatic.com",
          "font-src 'self' data: https://fonts.gstatic.com",
          "connect-src 'self' https://uploadthing.com https://*.uploadthing.com https://*.ufs.sh https://api.stripe.com https://www.google.com https://va.vercel-scripts.com https://vitals.vercel-insights.com",
          "frame-src 'self' blob: https://js.stripe.com https://hooks.stripe.com https://www.google.com",
          "frame-ancestors 'self'",
          "worker-src 'self' blob:",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          'upgrade-insecure-requests',
        ].join('; '),
      })
      headers.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains',
      })
    }

    return [
      {
        source: '/(.*)',
        headers,
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
