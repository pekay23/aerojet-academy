import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequestWithAuth } from 'next-auth/middleware'

export default withAuth(
  function proxy(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Role-based route protection
    const roleRoutes: Record<string, string[]> = {
      '/staff': ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
      '/api/staff': ['SUPER_ADMIN', 'ADMIN', 'STAFF'],
      '/applicant': ['APPLICANT'],
      '/api/applicant': ['APPLICANT'],
      '/student': ['STUDENT'],
      '/api/student': ['STUDENT'],
      '/instructor': ['INSTRUCTOR'],
      '/api/instructor': ['INSTRUCTOR'],
    }

    for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
      if (pathname.startsWith(route)) {
        const userRole = token?.role as string
        if (!userRole || !allowedRoles.includes(userRole)) {
          if (pathname.startsWith('/api/')) {
            return NextResponse.json(
              { success: false, error: 'Forbidden: insufficient permissions' },
              { status: 403 }
            )
          }
          // Redirect to appropriate portal based on role
          const redirectMap: Record<string, string> = {
            SUPER_ADMIN: '/staff',
            ADMIN: '/staff',
            STAFF: '/staff',
            INSTRUCTOR: '/instructor',
            STUDENT: '/student',
            APPLICANT: '/applicant',
          }
          const redirectTo = redirectMap[userRole] || '/login'
          return NextResponse.redirect(new URL(redirectTo, req.url))
        }
      }
    }

    // Account status check
    const status = token?.status as string
    if (status === 'SUSPENDED' || status === 'DEACTIVATED') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'Account is suspended or deactivated' },
          { status: 403 }
        )
      }
      return NextResponse.redirect(new URL('/login?error=AccountSuspended', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        // Allow public routes
        if (
          pathname.startsWith('/api/public') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/api/cron') ||
          pathname.startsWith('/api/webhooks') ||
          pathname.startsWith('/api/uploadthing') ||
          pathname === '/' ||
          pathname === '/login' ||
          pathname === '/register' ||
          pathname === '/forgot-password' ||
          pathname === '/reset-password' ||
          pathname.startsWith('/_next') ||
          pathname.startsWith('/images') ||
          pathname.startsWith('/favicon')
        ) {
          return true
        }
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/staff/:path*',
    '/applicant/:path*',
    '/student/:path*',
    '/instructor/:path*',
    '/change-password',
  ],
}
