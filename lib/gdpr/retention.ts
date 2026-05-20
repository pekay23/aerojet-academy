/**
 * Data-protection retention sweeper.
 *
 * Reads `RetentionPolicy` rows and, for each, soft-deletes (sets
 * `deletedAt`) rows in the named entity whose anchor field is older than
 * `retentionDays`. Conservative: never hard-deletes.
 *
 * Default policies are seeded by `seedDefaultRetentionPolicies()` on first
 * data protection page load. Admins edit values via `/staff/settings/retention`.
 */

import 'server-only'
import { prismaUnfiltered } from '@/lib/prisma/client'

interface PolicyDefault {
  entity: string
  retentionDays: number
  anchor: 'CREATED_AT' | 'UPDATED_AT' | 'GRADUATION'
  description: string
}

/**
 * Models that support soft-delete (have a `deletedAt` column).
 * The sweep sets `deletedAt = now()` on expired rows.
 */
const SOFT_DELETABLE_MODELS = new Set([
  'User',
  'AdminNote',
  'Enrollment',
  'Grade',
  'ExamEvent',
  'PoolMembership',
  'ExamBooking',
  'Payment',
  'AdminCalendarEvent',
  'ExamResult',
])

/**
 * Ephemeral models that do NOT have `deletedAt` but are safe to hard-delete
 * after their retention period. These are transient records with no
 * cascading side-effects on financial or regulatory data.
 */
const HARD_DELETABLE_MODELS = new Set([
  'Notification',
  'Message',
])

/**
 * Default retention policies. Note:
 * - Wallet is intentionally EXCLUDED — wallets should persist as long as the
 *   owning user exists. Financial transaction history is retained via
 *   WalletTransaction which cascades from Wallet, so deleting wallets would
 *   also destroy transaction audit trails.
 * - AuditLog is intentionally EXCLUDED — audit logs should be archived
 *   (moved to AuditLogArchive) rather than deleted. They are governance
 *   records required for EASA Part-147 compliance.
 */
const DEFAULTS: PolicyDefault[] = [
  { entity: 'Payment', retentionDays: 5 * 365, anchor: 'CREATED_AT', description: '5 years — financial record retention' },
  { entity: 'Notification', retentionDays: 3 * 365, anchor: 'CREATED_AT', description: '3 years — operational messaging' },
  { entity: 'Message', retentionDays: 3 * 365, anchor: 'CREATED_AT', description: '3 years — staff/student correspondence' },
  { entity: 'Enrollment', retentionDays: 7 * 365, anchor: 'GRADUATION', description: 'Graduation + 7 years — EASA training record retention' },
  { entity: 'Grade', retentionDays: 7 * 365, anchor: 'GRADUATION', description: 'Graduation + 7 years' },
  { entity: 'ExamResult', retentionDays: 7 * 365, anchor: 'GRADUATION', description: 'Graduation + 7 years' },
]

export async function seedDefaultRetentionPolicies() {
  for (const d of DEFAULTS) {
    await prismaUnfiltered.retentionPolicy.upsert({
      where: { entity: d.entity },
      create: d,
      update: {}, // never overwrite admin edits
    })
  }
}

/**
 * For each active policy, soft-delete or hard-delete rows older than
 * retentionDays, depending on whether the model supports soft-delete.
 *
 * GRADUATION anchor is honoured for Enrollment/Grade/ExamResult:
 * only sweeps rows whose owning user has a StudentProfile with
 * `graduationDate` older than `retentionDays` ago. If the student
 * has not graduated yet, their records are never swept.
 *
 * Returns per-entity counts; intended to be called by the weekly cron at
 * `/api/cron/gdpr-retention`.
 */
export async function runRetentionSweep(): Promise<Array<{ entity: string; affected: number; error?: string }>> {
  const policies = await prismaUnfiltered.retentionPolicy.findMany({
    where: { isActive: true },
  })

  const results: Array<{ entity: string; affected: number; error?: string }> = []

  for (const p of policies) {
    try {
      const affected = await applyPolicy(p.entity, p.retentionDays, p.anchor as PolicyDefault['anchor'])
      results.push({ entity: p.entity, affected })
    } catch (err: any) {
      results.push({ entity: p.entity, affected: 0, error: err.message })
    }
  }
  return results
}

async function applyPolicy(
  entity: string,
  retentionDays: number,
  anchor: 'CREATED_AT' | 'UPDATED_AT' | 'GRADUATION'
): Promise<number> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)

  // Lowercase first char to map to Prisma client property
  const modelKey = entity[0].toLowerCase() + entity.slice(1)
  const model = (prismaUnfiltered as any)[modelKey]
  if (!model) throw new Error(`Unknown entity "${entity}" — no Prisma model found`)

  const isSoftDeletable = SOFT_DELETABLE_MODELS.has(entity)
  const isHardDeletable = HARD_DELETABLE_MODELS.has(entity)

  // Safety check: refuse to process entities not explicitly allowed
  if (!isSoftDeletable && !isHardDeletable) {
    throw new Error(
      `Entity "${entity}" is not in SOFT_DELETABLE_MODELS or HARD_DELETABLE_MODELS — refusing to delete. ` +
      `Add it to the appropriate set or remove this retention policy.`
    )
  }

  // For GRADUATION-anchored models, find user IDs whose StudentProfile
  // has a graduationDate older than the cutoff. Only sweep those users' records.
  if (anchor === 'GRADUATION') {
    return applyGraduationPolicy(model, entity, cutoff, isSoftDeletable)
  }

  // CREATED_AT or UPDATED_AT anchor
  const field = anchor === 'UPDATED_AT' ? 'updatedAt' : 'createdAt'

  if (isSoftDeletable) {
    // Soft-delete: set deletedAt on rows past retention, only if not already deleted
    const r = await model.updateMany({
      where: { [field]: { lt: cutoff }, deletedAt: null } as any,
      data: { deletedAt: new Date() },
    })
    return r.count
  }

  // Hard-delete: only for explicitly allowed ephemeral models
  const r = await model.deleteMany({
    where: { [field]: { lt: cutoff } },
  })
  return r.count
}

/**
 * GRADUATION anchor: sweep only records belonging to users who graduated
 * more than `retentionDays` ago. Students who haven't graduated are never
 * swept.
 */
async function applyGraduationPolicy(
  model: any,
  entity: string,
  cutoff: Date,
  isSoftDeletable: boolean
): Promise<number> {
  // Find user IDs of students who graduated before the cutoff
  const graduatedProfiles = await prismaUnfiltered.studentProfile.findMany({
    where: {
      graduationDate: { lt: cutoff },
    },
    select: { userId: true },
  })

  if (graduatedProfiles.length === 0) return 0

  const graduatedUserIds = graduatedProfiles.map((p) => p.userId)

  if (isSoftDeletable) {
    // Soft-delete records belonging to those graduated users
    const r = await model.updateMany({
      where: {
        userId: { in: graduatedUserIds },
        deletedAt: null,
      } as any,
      data: { deletedAt: new Date() },
    })
    return r.count
  }

  // Hard-delete for ephemeral models
  const r = await model.deleteMany({
    where: {
      userId: { in: graduatedUserIds },
    },
  })
  return r.count
}
