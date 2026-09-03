import 'server-only'
import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import prisma, { prismaUnfiltered } from '@/lib/prisma/client'

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  EVENT_OVERRIDE = 'EVENT_OVERRIDE',
  POOL_FAIL = 'POOL_FAIL',
  POOL_CONFIRM = 'POOL_CONFIRM',
  WITHDRAW = 'WITHDRAW',
  SYSTEM = 'SYSTEM',
  PAYMENT_APPROVE = 'PAYMENT_APPROVE',
  ENROLLMENT_APPROVE = 'ENROLLMENT_APPROVE',
  PAYMENT_RECONCILE_BULK = 'PAYMENT_RECONCILE_BULK',
  PAYMENT_REJECT = 'PAYMENT_REJECT',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
  WALLET_TOP_UP = 'WALLET_TOP_UP',
  IMPORT = 'IMPORT',
  APPROVE = 'APPROVE',
  // Internal exam actions
  EXAM_SESSION_STARTED = 'EXAM_SESSION_STARTED',
  EXAM_SESSION_SUBMITTED = 'EXAM_SESSION_SUBMITTED',
  EXAM_SESSION_AUTO_SUBMITTED = 'EXAM_SESSION_AUTO_SUBMITTED',
  EXAM_SESSION_FORCE_SUBMITTED = 'EXAM_SESSION_FORCE_SUBMITTED',
  EXAM_SESSION_EXTENDED = 'EXAM_SESSION_EXTENDED',
  EXAM_SESSION_RESUMED = 'EXAM_SESSION_RESUMED',
  EXAM_SESSION_SUPERVISE = 'EXAM_SESSION_SUPERVISE',
  EXAM_SCHEDULE_CREATED = 'EXAM_SCHEDULE_CREATED',
  EXAM_CREATED = 'EXAM_CREATED',
  EXAM_UPDATED = 'EXAM_UPDATED',
  EXAM_DELETED = 'EXAM_DELETED',
  EXAM_SCHEDULE_UPDATED = 'EXAM_SCHEDULE_UPDATED',
  EXAM_SCHEDULE_DELETED = 'EXAM_SCHEDULE_DELETED',
  EXAM_QUESTION_CREATED = 'EXAM_QUESTION_CREATED',
  EXAM_QUESTION_UPDATED = 'EXAM_QUESTION_UPDATED',
  EXAM_QUESTION_RETIRED = 'EXAM_QUESTION_RETIRED',
  EXAM_QUESTION_IMPORT = 'EXAM_QUESTION_IMPORT',
  EXAM_ACCESS_CODE_GENERATED = 'EXAM_ACCESS_CODE_GENERATED',
  EXAM_ACCESS_CODE_USED = 'EXAM_ACCESS_CODE_USED',
  EXAM_VIOLATION_LOGGED = 'EXAM_VIOLATION_LOGGED',
  EXAM_VIOLATION_REVIEWED = 'EXAM_VIOLATION_REVIEWED',
  EXAM_BANK_INSTRUCTOR_ASSIGNED = 'EXAM_BANK_INSTRUCTOR_ASSIGNED',
  EXAM_BANK_INSTRUCTOR_UPDATED = 'EXAM_BANK_INSTRUCTOR_UPDATED',
  EXAM_BANK_INSTRUCTOR_REVOKED = 'EXAM_BANK_INSTRUCTOR_REVOKED',
}

interface AuditLogParams {
  userId?: string
  targetUserId?: string
  action: string
  entity?: string
  entityId?: string
  description?: string
  changes?: Prisma.InputJsonValue
  ipAddress?: string
  userAgent?: string
  details?: Prisma.InputJsonValue // For backward compatibility
}

function computeHash(
  previousHash: string | null,
  action: string,
  entityId: string | undefined,
  changes: Prisma.InputJsonValue,
  timestamp: Date
): string {
  const data = [
    previousHash || '',
    action,
    entityId || '',
    JSON.stringify(changes || {}),
    timestamp.toISOString(),
  ].join('|')
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Logs a system or staff action to the audit_logs table.
 * Implements hash chain: each entry's hash includes the previous entry's hash.
 */
export async function logAuditEvent(params: AuditLogParams, tx?: Prisma.TransactionClient) {
  const client = tx || prisma
  try {
    const timestamp = new Date()

    // Fetch the most recent audit log entry for chain continuity
    const lastEntry = await prismaUnfiltered.auditLog.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { hash: true },
    })

    const previousHash = lastEntry?.hash || null
    const hash = computeHash(
      previousHash,
      params.action,
      params.entityId,
      params.changes ?? params.details ?? {},
      timestamp
    )

    return await client.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        description:
          params.description || (params.details ? JSON.stringify(params.details) : undefined),
        changes: params.changes || params.details || {},
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        previousHash,
        hash,
      },
    })
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR]', error)
    // We don't want to crash the main process if logging fails
    return null
  }
}

/**
 * Fetches audit logs with filtering and pagination
 */
export async function queryAuditLogs(params: {
  action?: AuditAction
  entity?: string
  userId?: string
  startDate?: Date
  endDate?: Date
  limit: number
  offset: number
}) {
  const where: Prisma.AuditLogWhereInput = {}
  if (params.action) where.action = params.action
  if (params.entity) where.entity = params.entity
  if (params.userId) where.userId = params.userId
  if (params.startDate || params.endDate) {
    where.createdAt = {
      ...(params.startDate && { gte: params.startDate }),
      ...(params.endDate && { lte: params.endDate }),
    }
  }

  const [logs, total] = await Promise.all([
    prismaUnfiltered.auditLog.findMany({
      where,
      take: params.limit,
      skip: params.offset,
      orderBy: { createdAt: 'desc' },
      include: { user: { include: { profile: true } } },
    }),
    prismaUnfiltered.auditLog.count({ where }),
  ])

  return { logs, total }
}

/**
 * Alias for logAuditEvent for legacy/cron compatibility
 */
export const createAuditLog = logAuditEvent
