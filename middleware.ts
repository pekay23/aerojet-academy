import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Edge-level middleware for image protection.
 *
 * - Protects /api/images/* routes from unauthorized access
 * - Validates Referer header to prevent hotlinking
 * - Sets Content-Security-Policy headers for image sources
 * - Blocks direct access to protected image patterns
 */
export async function middleware(request: NextRequest) {
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

    // Optional: role-gate specific image routes
    // e.g. /api/images/staff/* requires STAFF/ADMIN role
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

  // ── 2. Hotlink protection for image files served from public ──
  // Block direct access attempts to public image files from external referers
  if (
    pathname.match(/\.(webp|png|jpg|jpeg|gif|svg|avif)$/i) &&
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/_next/')
  ) {
    const referer = request.headers.get('referer') || ''
    const host = request.headers.get('host') || ''

    // If there's a referer and it's not from our domain, block it
    if (referer) {
      try {
        const refererUrl = new URL(referer)
        if (refererUrl.hostname !== host && !refererUrl.hostname.endsWith('.' + host)) {
          // Return a 1x1 transparent pixel instead of the real image
          return new NextResponse(
            Buffer.from(
              'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
              'base64'
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

  // Only apply strict CSP in production
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
    // Prevent the browser from storing images in the back-forward cache
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