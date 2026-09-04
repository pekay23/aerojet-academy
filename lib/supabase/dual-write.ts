/**
 * Supabase Dual-Write Utilities
 *
 * Provides functions to write to both Neon (primary) and Supabase (backup) databases.
 * Uses Prisma for both connections - Supabase connection uses the same schema.
 *
 * Key Features:
 * - Non-blocking Supabase writes (fire-and-forget for performance)
 * - Graceful error handling (primary DB write always succeeds)
 * - Same Prisma schema works for both databases
 * - Automatic data transformation
 */

import { prismaUnfiltered } from '@/lib/prisma/client'
import { isBackupEnabled } from './client'
import { Prisma } from '@prisma/client'

// All Prisma model names
const MODELS = [
  'user',
  'profile',
  'studentProfile',
  'instructorProfile',
  'staffProfile',
  'licenseCategory',
  'licenseModuleRequirement',
  'studyPathwayModel',
  'academicTerm',
  'termCourseAssignment',
  'studentLicenseTarget',
  'examComponent',
  'course',
  'courseCategory',
  'enrollment',
  'class',
  'attendanceRecord',
  'grade',
  'examEvent',
  'examPool',
  'poolMembership',
  'poolWaitlist',
  'wallet',
  'walletTransaction',
  'exam',
  'examBooking',
  'bookingEntitlement',
  'examResult',
  'examBundle',
  'payment',
  'invoice',
  'notification',
  'message',
  'auditLog',
  'systemSetting',
  'paymentMethod',
  'fileUpload',
  'newsArticle',
  'generalResource',
  'academicYear',
  'semester',
  'fullTimeProgramme',
  'programmeYear',
  'fullTimeEnrollment',
  'ojtPeriod',
  'paymentMilestone',
  'modularPackage',
  'modularEnrollment',
  'tuitionRun',
  'tuitionBooking',
  'emailTemplate',
  'referral',
  'adminNote',
] as const

type ModelKey = (typeof MODELS)[number]

/**
 * Get Supabase Prisma client for backup operations
 * This creates a secondary Prisma client connected to Supabase
 */
let cachedSupabasePrisma: any = null

export async function getSupabasePrismaClient() {
  if (cachedSupabasePrisma) return cachedSupabasePrisma

  const supabaseUrl = process.env.SUPABASE_DATABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  // Dynamic import to avoid issues when not configured
  const { PrismaClient } = await import('@prisma/client')
  const { PrismaPg } = await import('@prisma/adapter-pg')
  const { Pool } = await import('pg')

  // Parse URL to extract components — avoids issues with special
  // characters (like #) in passwords that URL parsing may mangle.
  const parsed = new URL(supabaseUrl)
  const pool = new Pool({
    host: parsed.hostname,
    port: parseInt(parsed.port || '5432', 10),
    database: parsed.pathname.replace('/', ''),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    ssl: true,
    max: 5,
  })

  const adapter = new PrismaPg(pool)
  cachedSupabasePrisma = new PrismaClient({ adapter })
  return cachedSupabasePrisma
}

/**
 * Transform data for Supabase (handle BigInt, Date, etc.)
 */
export function transformForSupabase<T>(data: T): T {
  if (data === null || data === undefined) {
    return data
  }

  const transformed: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (value === undefined) continue
    if (typeof value === 'function' || typeof value === 'symbol') continue

    // Convert BigInt to string
    if (typeof value === 'bigint') {
      transformed[key] = value.toString()
      continue
    }

    // Convert Date to ISO string
    if (value instanceof Date) {
      transformed[key] = value.toISOString()
      continue
    }

    // Convert Prisma Decimal to number
    if (
      value !== null &&
      typeof value === 'object' &&
      'toNumber' in value &&
      typeof (value as any).toNumber === 'function'
    ) {
      transformed[key] = (value as any).toNumber()
      continue
    }

    // Handle arrays
    if (Array.isArray(value)) {
      transformed[key] = value.map((item) => (typeof item === 'bigint' ? item.toString() : item))
      continue
    }

    // Handle nested objects
    if (value !== null && typeof value === 'object') {
      transformed[key] = transformForSupabase(value)
      continue
    }

    transformed[key] = value
  }

  return transformed as T
}

/**
 * Write to Supabase (non-blocking)
 * Uses type assertion to avoid TypeScript dynamic access issues
 */
async function writeToSupabase<T>(
  modelKey: ModelKey,
  operation: 'create' | 'update' | 'delete',
  data?: T,
  where?: Record<string, unknown>
): Promise<void> {
  const supabase = await getSupabasePrismaClient()

  if (!supabase) {
    return
  }

  try {
    const transformedData = data ? transformForSupabase(data) : undefined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = (supabase as any)[modelKey] as {
      create: (args: { data: any }) => Promise<unknown>
      update: (args: { where: Record<string, unknown>; data: any }) => Promise<unknown>
      delete: (args: { where: Record<string, unknown> }) => Promise<unknown>
    }

    switch (operation) {
      case 'create':
        await model.create({ data: transformedData as T })
        break
      case 'update':
        await model.update({ where: where!, data: transformedData as T })
        break
      case 'delete':
        await model.delete({ where: where! })
        break
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Supabase] ${operation.toUpperCase()} ${modelKey}`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[Supabase] Backup failed for ${modelKey} (${operation}):`, message)

    // Retry once after a brief delay for transient failures
    try {
      await new Promise((r) => setTimeout(r, 1000))
      const retryClient = await getSupabasePrismaClient()
      if (!retryClient) return
      const retryModel = (retryClient as any)[modelKey]
      if (operation === 'create' && data) await retryModel.create({ data: transformForSupabase(data) })
      else if (operation === 'update' && data && where) await retryModel.update({ where, data: transformForSupabase(data) })
      else if (operation === 'delete' && where) await retryModel.delete({ where })
      console.log(`[Supabase] Retry succeeded for ${modelKey} (${operation})`)
    } catch (retryError) {
      console.error(`[Supabase] Retry also failed for ${modelKey} (${operation}):`, retryError instanceof Error ? retryError.message : String(retryError))
    }
  }
}

/**
 * Create a record in primary DB (Neon) and backup to Supabase
 */
export async function createWithBackup<T extends Prisma.UserCreateInput>(
  modelKey: ModelKey,
  data: T
): Promise<T> {
  // Write to primary (Neon) - use type assertion for dynamic access
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await (prismaUnfiltered as any)[modelKey].create({ data })) as T

  // Backup to Supabase (non-blocking)
  if (isBackupEnabled()) {
    writeToSupabase(modelKey, 'create', result).catch(() => {})
  }

  return result
}

/**
 * Update a record in primary DB and backup to Supabase
 */
export async function updateWithBackup<T extends Prisma.UserUpdateInput>(
  modelKey: ModelKey,
  where: Record<string, unknown>,
  data: T
): Promise<T> {
  // Write to primary (Neon) - use type assertion for dynamic access
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await (prismaUnfiltered as any)[modelKey].update({ where, data })) as T

  // Backup to Supabase (non-blocking)
  if (isBackupEnabled()) {
    writeToSupabase(modelKey, 'update', result, where).catch(() => {})
  }

  return result
}

/**
 * Delete a record from primary DB and Supabase
 */
export async function deleteWithBackup(
  modelKey: ModelKey,
  where: Record<string, unknown>
): Promise<void> {
  // Delete from primary (Neon) - use type assertion for dynamic access
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prismaUnfiltered as any)[modelKey].delete({ where })

  // Delete from Supabase (non-blocking)
  if (isBackupEnabled()) {
    writeToSupabase(modelKey, 'delete', undefined, where).catch(() => {})
  }
}

/**
 * Read from primary with Supabase fallback
 */
export async function readWithFallback<T>(
  modelKey: ModelKey,
  where: Record<string, unknown>
): Promise<T | null> {
  // Try primary first
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (prismaUnfiltered as any)[modelKey].findUnique({ where })
    if (result) return result as T
  } catch (error) {
    console.warn(`[Supabase] Primary DB read failed, trying backup:`, error)
  }

  // Fallback to Supabase
  const supabasePrisma = await getSupabasePrismaClient()
  if (supabasePrisma && isBackupEnabled()) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (supabasePrisma as any)[modelKey].findUnique({ where })
      if (result) {
        console.log(`[Supabase] Retrieved ${modelKey} from Supabase fallback`)
        return result as T
      }
    } catch (error) {
      console.error(`[Supabase] Fallback read failed:`, error)
    }
  }

  return null
}

/**
 * Check if backup is active
 */
export function isBackupActive(): boolean {
  return isBackupEnabled()
}

export { MODELS as BACKUP_MODELS }
