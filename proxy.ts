import { type NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Next.js 16 Proxy file for image protection (replaces deprecated middleware.ts).
 *
 * @see https://nextjs.org/docs/messages/middleware-to-proxy
 *
 * IMPORTANT: This proxy is IMAGES-ONLY. It does NOT gate /staff/*, /instructor/*,
 * /student/*, /examiner/*, /applicant/* or their /api/* siblings. Role enforcement
 * for those portals is handled at the layout layer (lib/auth/helpers.ts) and at
 * each individual route handler.
 *
 * Provides:
 * - Auth-gating for /api/images/* routes via NextAuth JWT
 * - Hotlink prevention via Referer header validation
 * - Security headers (CSP, X-Content-Type-Options, Cache-Control) on image responses
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── 1. Protect the image proxy/transform API routes ──────────
  if (pathname.startsWith('/api/images/')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      // Allow unauthenticated requests to /api/images/public/* only
      if (pathname.startsWith('/api/images/public/')) {
        return NextResponse.next()
      }
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Role-gate /api/images/staff/* routes
    if (pathname.startsWith('/api/images/staff/')) {
      const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'EXAMINER']
      const role = (token.role as string) || ''
      if (!allowedRoles.includes(role)) {
        return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }
  }

  // ── 2. Hotlink protection for image files ──
  if (
    pathname.match(/\.(webp|png|jpg|jpeg|gif|svg|avif)$/i) &&
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/_next/')
  ) {
    const referer = request.headers.get('referer') || ''
    const host = request.headers.get('host') || ''

    if (referer) {
      try {
        const refererUrl = new URL(referer)
        const refererHost = refererUrl.hostname
        const hostName = host.split(':')[0] || ''
        if (refererHost !== hostName && !refererHost.endsWith('.' + hostName)) {
          // Return a 1x1 transparent pixel instead of the real image
          return new NextResponse(
            new Uint8Array(
              Buffer.from(
                'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                'base64'
              )
            ),
            {
              status: 200,
              headers: {
                'Content-Type': 'image/gif',
                'Cache-Control': 'no-store, no-cache, must-revalidate',
              },
            }
          )
        }
      } catch {
        // Invalid referer URL — allow through
      }
    }
  }

  // ── 3. Add security headers for image responses ──
  const requestHeaders = new Headers(request.headers)

  // Build CSP img-src dynamically based on environment
  const cspDirectives = [
    "default-src 'self'",
    `img-src 'self' data: blob: https:`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ]

  if (process.env.NODE_ENV === 'production') {
    requestHeaders.set(
      'Content-Security-Policy',
      cspDirectives.join('; ')
    )
  }

  // ── 4. Response with additional security headers for images ──
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  if (pathname.match(/\.(webp|png|jpg|jpeg|gif|svg|avif)$/i)) {
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Cache-Control', 'private, max-age=3600')
    response.headers.set('Permissions-Policy', 'interest-cohort=()')
  }

  return response
}

export const config = {
  matcher: [
    // Protect image-related API routes
    '/api/images/:path*',
    // Add security headers to all image files
    '/((?!_next/static|_next/image|favicon.ico).*\\..*webp|.*\\..*png|.*\\..*jpg|.*\\..*jpeg|.*\\..*gif|.*\\..*svg|.*\\..*avif)',
  ],
}