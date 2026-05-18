import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Root middleware — enforces authentication and basic role checks
 * for protected portal and API routes. This acts as a safety net
 * so a missing getAuthSession() call in a route handler doesn't
 * silently expose data.
 */

const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'EXAMINER']
const PORTAL_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'STAFF',
  'EXAMINER',
  'INSTRUCTOR',
  'STUDENT',
  'APPLICANT',
]

// Map route prefixes to the roles allowed to access them
const ROUTE_ROLE_MAP: Record<string, string[]> = {
  '/staff': ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
  '/api/staff': ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'EXAMINER'],
  '/instructor': ['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'],
  '/api/instructor': ['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'],
  '/student': ['STUDENT', 'ADMIN', 'SUPER_ADMIN', 'STAFF'],
  '/api/student': ['STUDENT', 'ADMIN', 'SUPER_ADMIN', 'STAFF'],
  '/examiner': ['EXAMINER', 'ADMIN', 'SUPER_ADMIN'],
  '/api/examiner': ['EXAMINER', 'ADMIN', 'SUPER_ADMIN'],
  '/applicant': ['APPLICANT', 'STUDENT', 'ADMIN', 'SUPER_ADMIN', 'STAFF'],
  '/api/applicant': ['APPLICANT', 'STUDENT', 'ADMIN', 'SUPER_ADMIN', 'STAFF'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Find matching role requirement
  const matchedPrefix = Object.keys(ROUTE_ROLE_MAP).find((prefix) => pathname.startsWith(prefix))
  if (!matchedPrefix) return NextResponse.next()

  const token = await getToken({ req: request })

  // No token → redirect to login (pages) or 401 (API)
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check role
  const userRole = token.role as string
  const allowedRoles = ROUTE_ROLE_MAP[matchedPrefix]
  if (!allowedRoles.includes(userRole)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    // Redirect to the user's correct portal instead of login
    const portalMap: Record<string, string> = {
      SUPER_ADMIN: '/staff',
      ADMIN: '/staff',
      STAFF: '/staff',
      INSTRUCTOR: '/instructor',
      STUDENT: '/student',
      APPLICANT: '/applicant',
      EXAMINER: '/examiner',
    }
    return NextResponse.redirect(new URL(portalMap[userRole] || '/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/staff/:path*',
    '/instructor/:path*',
    '/student/:path*',
    '/examiner/:path*',
    '/applicant/:path*',
    '/api/staff/:path*',
    '/api/instructor/:path*',
    '/api/student/:path*',
    '/api/examiner/:path*',
    '/api/applicant/:path*',
  ],
}
