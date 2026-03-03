import prisma from '@/lib/prisma/client'

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
}

interface AuditLogParams {
  userId?: string
  action: string
  entity?: string
  entityId?: string
  description?: string
  changes?: any
  ipAddress?: string
  userAgent?: string
  details?: any // For backward compatibility
}

/**
 * Logs a system or staff action to the audit_logs table.
 */
export async function logAuditEvent(params: AuditLogParams, tx?: any) {
  const client = tx || prisma
  try {
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
  const where: any = {}
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
    prisma.auditLog.findMany({
      where,
      take: params.limit,
      skip: params.offset,
      orderBy: { createdAt: 'desc' },
      include: { user: { include: { profile: true } } },
    }),
    prisma.auditLog.count({ where }),
  ])

  return { logs, total }
}

/**
 * Alias for logAuditEvent for legacy/cron compatibility
 */
export const createAuditLog = logAuditEvent
