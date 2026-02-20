import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function getTokenFromRequest(req: NextRequest) {
  return getToken({ req, secret: process.env.NEXTAUTH_SECRET })
}

export function redirectToLogin(req: NextRequest, error?: string) {
  const url = new URL('/login', req.url)
  if (error) url.searchParams.set('error', error)
  return NextResponse.redirect(url)
}

export function redirectToPortal(req: NextRequest, role: string) {
  const portalMap: Record<string, string> = {
    SUPER_ADMIN: '/staff',
    ADMIN: '/staff',
    STAFF: '/staff',
    INSTRUCTOR: '/instructor',
    STUDENT: '/student',
    APPLICANT: '/applicant',
  }
  return NextResponse.redirect(new URL(portalMap[role] || '/login', req.url))
}

export function jsonForbidden(message = 'Forbidden') {
  return NextResponse.json({ success: false, error: message }, { status: 403 })
}
