import prisma from '@/lib/prisma/client'

export const AuditAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  IMPORT: 'IMPORT',
  EXPORT: 'EXPORT',
  WALLET_TOP_UP: 'WALLET_TOP_UP',
  ENROLLMENT_APPROVE: 'ENROLLMENT_APPROVE',
  PAYMENT_APPROVE: 'PAYMENT_APPROVE',
  PAYMENT_REJECT: 'PAYMENT_REJECT',
  SYSTEM_UPDATE: 'SYSTEM_UPDATE',
  PAYMENT_RECONCILE_BULK: 'PAYMENT_RECONCILE_BULK',
} as const

interface AuditEntry {
  action: string
  entity?: string
  entityId?: string
  userId?: string
  description?: string
  changes?: Record<string, unknown>
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(entry: AuditEntry) {
  try {
    return await prisma.auditLog.create({
      data: {
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        userId: entry.userId,
        description: entry.description,
        changes: (entry.changes || entry.details) as any,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    })
  } catch (error) {
    // Audit logging should never cause API failures
    console.error('[Audit] Failed to create log:', error)
    return null
  }
}

export async function queryAuditLogs(options: {
  action?: string
  entity?: string
  entityId?: string
  userId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const where: any = {}

  if (options.action) where.action = options.action
  if (options.entity) where.entity = options.entity
  if (options.entityId) where.entityId = options.entityId
  if (options.userId) where.userId = options.userId

  if (options.startDate || options.endDate) {
    where.createdAt = {}
    if (options.startDate) where.createdAt.gte = options.startDate
    if (options.endDate) where.createdAt.lte = options.endDate
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          include: {
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit ?? 50,
      skip: options.offset ?? 0,
    }),
    prisma.auditLog.count({ where }),
  ])

  return { logs, total }
}
