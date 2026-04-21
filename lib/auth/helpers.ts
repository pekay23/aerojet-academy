import { getAuthSession } from '@/lib/auth/auth-options'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prismaBase as prisma } from '@/lib/prisma/db-base'

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
 * Generate Student ID with collision prevention
 * Format: AATA-YYYY-XXXX (e.g., AATA-2026-0001)
 * Uses database sequence to ensure uniqueness
 */
export async function generateStudentId(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `AATA-${year}-`

  // Use advisory lock via serializable transaction to prevent race conditions
  const MAX_RETRIES = 3
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const result = await prisma.$transaction(async (tx) => {
      const lastStudent = await tx.studentProfile.findFirst({
        where: { studentId: { startsWith: prefix } },
        orderBy: { studentId: 'desc' },
        select: { studentId: true },
      })

      let nextSequence = 1
      if (lastStudent?.studentId) {
        const lastSequence = parseInt(lastStudent.studentId.replace(prefix, ''), 10)
        if (!isNaN(lastSequence)) {
          nextSequence = lastSequence + 1
        }
      }

      if (nextSequence > 9999) {
        throw new Error(`Student ID sequence exhausted for year ${year}`)
      }

      return `AATA-${year}-${nextSequence.toString().padStart(4, '0')}`
    }, { isolationLevel: 'Serializable' })

    return result
  }

  throw new Error('Failed to generate unique student ID after retries')
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
  console.log('[AUTH_DEBUG] verifyPassword called')
  try {
    const result = await bcrypt.compare(password, hashedPassword)
    console.log('[AUTH_DEBUG] bcrypt.compare result:', result)
    return result
  } catch (err) {
    console.error('[AUTH_DEBUG] verifyPassword ERROR:', err)
    return false
  }
}

export function generateTempPassword(): string {
  return crypto.randomBytes(6).toString('base64url')
}

export async function generateAcademyEmail(
  firstName: string,
  middleName: string | null | undefined,
  lastName: string
): Promise<string> {
  const getInitial = (name: string) =>
    name
      .charAt(0)
      .toLowerCase()
      .replace(/[^a-z]/g, '')

  // Get initials of all first names
  const firstInitials = firstName.trim().split(/\s+/).map(getInitial).filter(Boolean)

  // Get initials of all middle names
  const middleInitials = (middleName || '').trim().split(/\s+/).map(getInitial).filter(Boolean)

  const cleanSurname = lastName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

  const initials = [...firstInitials, ...middleInitials].filter(Boolean)

  const baseLocal = initials.length > 0
    ? `${initials.join('.')}.${cleanSurname}`
    : cleanSurname

  // Ensure uniqueness — append numeric suffix if email already taken
  let candidate = `${baseLocal}@aerojet-academy.com`
  let suffix = 1
  while (await prisma.user.findFirst({ where: { academyEmail: candidate } })) {
    candidate = `${baseLocal}${suffix}@aerojet-academy.com`
    suffix++
  }

  return candidate
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
