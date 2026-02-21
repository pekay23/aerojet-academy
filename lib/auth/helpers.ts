import { getAuthSession } from '@/lib/auth/auth-options'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

/** Generates a random registration code like AERO-2026-A1B2C3 */
export function generateRegistrationCode(): string {
  const year = new Date().getFullYear()
  const random = crypto.randomBytes(3).toString('hex').toUpperCase()
  return `AERO-${year}-${random}`
}

/** Generates a random secure token */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Simple in-memory rate limiter.
 * Returns true if the request is allowed, false if rate-limited.
 */
export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= maxRequests) return false
  entry.count++
  return true
}

/** Extracts client IP from Next.js request headers */
export function getClientIp(req: { headers: { get(name: string): string | null } }): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

export { getAuthSession }

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateTempPassword(): string {
  return Math.random().toString(36).slice(-8)
}

export function generateAcademyEmail(
  firstName: string,
  middleName: string | null | undefined,
  lastName: string
): string {
  const getInitial = (name: string) =>
    name
      .charAt(0)
      .toLowerCase()
      .replace(/[^a-z]/g, '')

  const firstInitials = firstName.trim().split(/\s+/).map(getInitial).filter(Boolean)
  const middleInitials = (middleName || '').trim().split(/\s+/).map(getInitial).filter(Boolean)
  const cleanSurname = lastName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

  const allInitials = [...firstInitials, ...middleInitials]

  if (allInitials.length > 0) {
    return `${allInitials.join('.')}.${cleanSurname}@aerojet-academy.com`
  }
  return `${cleanSurname}@aerojet-academy.com`
}

export function generateStudentId(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000).toString()
  return `AATA-${year}-${random}`
}

export async function requireStaff() {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)) {
    throw new Error('Unauthorized')
  }
  return session.user
}

export async function requireStudent() {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'STUDENT') {
    throw new Error('Unauthorized')
  }
  return session.user
}

export async function requireInstructor() {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') {
    throw new Error('Unauthorized')
  }
  return session.user
}

export async function requireAdmin() {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    throw new Error('Unauthorized')
  }
  return session.user
}

export async function requireAuth() {
  const session = await getAuthSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session.user
}

export async function requireApplicant() {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'APPLICANT') {
    throw new Error('Unauthorized')
  }
  return session.user
}
