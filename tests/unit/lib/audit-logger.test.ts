import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { logAuditEvent, queryAuditLogs, AuditAction, createAuditLog } from '@/lib/audit/logger'

describe('lib/audit/logger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('logAuditEvent', () => {
    it('creates an audit log with all provided fields', async () => {
      prismaMock.auditLog.create.mockResolvedValue({
        id: 'audit-1',
        action: AuditAction.CREATE,
        userId: 'user-1',
        entity: 'Payment',
        entityId: 'pay-1',
        description: 'Payment approved',
        changes: { status: { before: 'PENDING', after: 'APPROVED' } },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      })

      const result = await logAuditEvent({
        action: AuditAction.CREATE,
        userId: 'user-1',
        entity: 'Payment',
        entityId: 'pay-1',
        description: 'Payment approved',
        changes: { status: { before: 'PENDING', after: 'APPROVED' } },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      })

      expect(result).toEqual({
        id: 'audit-1',
        action: AuditAction.CREATE,
        userId: 'user-1',
        entity: 'Payment',
        entityId: 'pay-1',
        description: 'Payment approved',
        changes: { status: { before: 'PENDING', after: 'APPROVED' } },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      })
      expect(prismaMock.auditLog.create).toHaveBeenCalledTimes(1)
    })

    it('uses description when provided, not details', async () => {
      prismaMock.auditLog.create.mockResolvedValue({ id: 'audit-2' })

      await logAuditEvent({
        action: AuditAction.UPDATE,
        description: 'User role changed',
        details: { oldRole: 'STUDENT', newRole: 'INSTRUCTOR' },
      })

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: undefined,
          action: AuditAction.UPDATE,
          entity: undefined,
          entityId: undefined,
          description: 'User role changed',
          changes: { oldRole: 'STUDENT', newRole: 'INSTRUCTOR' },
          ipAddress: undefined,
          userAgent: undefined,
        },
      })
    })

    it('falls back to JSON.stringify(details) when description is absent', async () => {
      prismaMock.auditLog.create.mockResolvedValue({ id: 'audit-3' })

      await logAuditEvent({
        action: AuditAction.SYSTEM,
        details: { event: 'cron_run', status: 'success' },
      })

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: undefined,
          action: AuditAction.SYSTEM,
          entity: undefined,
          entityId: undefined,
          description: JSON.stringify({ event: 'cron_run', status: 'success' }),
          changes: { event: 'cron_run', status: 'success' },
          ipAddress: undefined,
          userAgent: undefined,
        },
      })
    })

    it('stores changes as an object diff, not a metadata string', async () => {
      prismaMock.auditLog.create.mockResolvedValue({ id: 'audit-4' })

      const changes = { before: { status: 'PENDING' }, after: { status: 'APPROVED' } }

      await logAuditEvent({
        action: AuditAction.PAYMENT_APPROVE,
        userId: 'staff-1',
        targetUserId: 'student-1',
        description: 'Payment approved for student',
        changes,
      })

      const callArgs = (prismaMock.auditLog.create as any).mock.calls[0][0]
      expect(callArgs.data.changes).toEqual(changes)
      expect(typeof callArgs.data.changes).toBe('object')
      expect(callArgs.data.changes).not.toBe('metadata')
    })

    it('defaults changes to empty object when neither changes nor details provided', async () => {
      prismaMock.auditLog.create.mockResolvedValue({ id: 'audit-5' })

      await logAuditEvent({
        action: AuditAction.LOGIN,
        userId: 'user-1',
      })

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          action: AuditAction.LOGIN,
          entity: undefined,
          entityId: undefined,
          description: undefined,
          changes: {},
          ipAddress: undefined,
          userAgent: undefined,
        },
      })
    })

    it('handles all AuditAction enum values', async () => {
      prismaMock.auditLog.create.mockResolvedValue({ id: 'audit-6' })

      const actions = [
        AuditAction.CREATE,
        AuditAction.UPDATE,
        AuditAction.DELETE,
        AuditAction.LOGIN,
        AuditAction.EVENT_OVERRIDE,
        AuditAction.POOL_FAIL,
        AuditAction.POOL_CONFIRM,
        AuditAction.WITHDRAW,
        AuditAction.SYSTEM,
        AuditAction.PAYMENT_APPROVE,
        AuditAction.ENROLLMENT_APPROVE,
        AuditAction.PAYMENT_RECONCILE_BULK,
        AuditAction.PAYMENT_REJECT,
        AuditAction.SYSTEM_UPDATE,
        AuditAction.WALLET_TOP_UP,
        AuditAction.IMPORT,
        AuditAction.APPROVE,
      ]

      for (const action of actions) {
        await logAuditEvent({ action, description: `Test ${action}` })
      }

      expect(prismaMock.auditLog.create).toHaveBeenCalledTimes(actions.length)
    })

    it('returns null and logs error when Prisma throws', async () => {
      prismaMock.auditLog.create.mockRejectedValueOnce(new Error('DB connection lost'))

      const result = await logAuditEvent({
        action: AuditAction.SYSTEM,
        description: 'Should fail gracefully',
      })

      expect(result).toBeNull()
      expect(console.error).toHaveBeenCalledWith('[AUDIT_LOG_ERROR]', expect.any(Error))
    })

    it('supports a custom transaction client via tx parameter', async () => {
      const mockTx = {
        auditLog: {
          create: vi.fn().mockResolvedValue({ id: 'audit-tx' }),
        },
      }

      const result = await logAuditEvent(
        {
          action: AuditAction.CREATE,
          description: 'Within transaction',
        },
        mockTx as any
      )

      expect(result).toEqual({ id: 'audit-tx' })
      expect(mockTx.auditLog.create).toHaveBeenCalledTimes(1)
      expect(prismaMock.auditLog.create).not.toHaveBeenCalled()
    })
  })

  describe('queryAuditLogs', () => {
    beforeEach(() => {
      prismaMock.auditLog.findMany.mockResolvedValue([])
      prismaMock.auditLog.count.mockResolvedValue(0)
    })

    it('queries logs with limit and offset', async () => {
      prismaMock.auditLog.findMany.mockResolvedValue([{ id: 'a1' }])
      prismaMock.auditLog.count.mockResolvedValue(1)

      const result = await queryAuditLogs({ limit: 10, offset: 0 })

      expect(result).toEqual({ logs: [{ id: 'a1' }], total: 1 })
      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith({
        where: {},
        take: 10,
        skip: 0,
        orderBy: { createdAt: 'desc' },
        include: { user: { include: { profile: true } } },
      })
      expect(prismaMock.auditLog.count).toHaveBeenCalledWith({ where: {} })
    })

    it('filters by action', async () => {
      await queryAuditLogs({ action: AuditAction.LOGIN, limit: 5, offset: 0 })

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith({
        where: { action: AuditAction.LOGIN },
        take: 5,
        skip: 0,
        orderBy: { createdAt: 'desc' },
        include: { user: { include: { profile: true } } },
      })
    })

    it('filters by userId and entity', async () => {
      await queryAuditLogs({ userId: 'user-1', entity: 'Payment', limit: 20, offset: 10 })

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', entity: 'Payment' },
        take: 20,
        skip: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { include: { profile: true } } },
      })
    })

    it('filters by date range', async () => {
      const start = new Date('2024-01-01')
      const end = new Date('2024-01-31')

      await queryAuditLogs({ startDate: start, endDate: end, limit: 10, offset: 0 })

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith({
        where: { createdAt: { gte: start, lte: end } },
        take: 10,
        skip: 0,
        orderBy: { createdAt: 'desc' },
        include: { user: { include: { profile: true } } },
      })
    })

    it('combines multiple filters', async () => {
      const start = new Date('2024-01-01')
      const end = new Date('2024-01-31')

      await queryAuditLogs({
        action: AuditAction.PAYMENT_APPROVE,
        userId: 'user-1',
        entity: 'Payment',
        startDate: start,
        endDate: end,
        limit: 50,
        offset: 20,
      })

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          action: AuditAction.PAYMENT_APPROVE,
          userId: 'user-1',
          entity: 'Payment',
          createdAt: { gte: start, lte: end },
        },
        take: 50,
        skip: 20,
        orderBy: { createdAt: 'desc' },
        include: { user: { include: { profile: true } } },
      })
    })
  })

  describe('createAuditLog', () => {
    it('is an alias for logAuditEvent', () => {
      expect(createAuditLog).toBe(logAuditEvent)
    })
  })
})
