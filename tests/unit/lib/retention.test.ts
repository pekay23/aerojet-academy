import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '../../setup'

// The module under test — will use the mocked prisma client automatically
import { seedDefaultRetentionPolicies, runRetentionSweep } from '@/lib/gdpr/retention'

describe('GDPR Retention Sweep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── seedDefaultRetentionPolicies ─────────────────────────────────
  describe('seedDefaultRetentionPolicies', () => {
    it('upserts default policies without overwriting admin edits', async () => {
      prismaMock.retentionPolicy.upsert.mockResolvedValue({})

      await seedDefaultRetentionPolicies()

      // Should upsert exactly 6 default policies (Wallet/AuditLog/Refund/WithdrawalRequest removed)
      expect(prismaMock.retentionPolicy.upsert).toHaveBeenCalledTimes(6)

      // Each call should have empty update (never overwrite admin edits)
      for (const call of prismaMock.retentionPolicy.upsert.mock.calls) {
        expect(call[0].update).toEqual({})
      }
    })

    it('seeds correct entities', async () => {
      prismaMock.retentionPolicy.upsert.mockResolvedValue({})

      await seedDefaultRetentionPolicies()

      const seededEntities = prismaMock.retentionPolicy.upsert.mock.calls.map(
        (call: any) => call[0].where.entity
      )

      expect(seededEntities).toEqual([
        'Payment',
        'Notification',
        'Message',
        'Enrollment',
        'Grade',
        'ExamResult',
      ])
    })

    it('does NOT seed Wallet policy (would cascade-delete transactions)', async () => {
      prismaMock.retentionPolicy.upsert.mockResolvedValue({})

      await seedDefaultRetentionPolicies()

      const seededEntities = prismaMock.retentionPolicy.upsert.mock.calls.map(
        (call: any) => call[0].where.entity
      )

      expect(seededEntities).not.toContain('Wallet')
    })

    it('does NOT seed AuditLog policy (should be archived, not deleted)', async () => {
      prismaMock.retentionPolicy.upsert.mockResolvedValue({})

      await seedDefaultRetentionPolicies()

      const seededEntities = prismaMock.retentionPolicy.upsert.mock.calls.map(
        (call: any) => call[0].where.entity
      )

      expect(seededEntities).not.toContain('AuditLog')
    })
  })

  // ─── runRetentionSweep — CREATED_AT anchor ────────────────────────
  describe('runRetentionSweep (CREATED_AT anchor)', () => {
    it('hard-deletes expired Notification records (ephemeral model)', async () => {
      prismaMock.retentionPolicy.findMany.mockResolvedValue([
        { entity: 'Notification', retentionDays: 1095, anchor: 'CREATED_AT', isActive: true },
      ])
      prismaMock.notification.deleteMany.mockResolvedValue({ count: 42 })

      const results = await runRetentionSweep()

      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({ entity: 'Notification', affected: 42 })

      // Verify it calls deleteMany (hard-delete) since Notification is in HARD_DELETABLE_MODELS
      expect(prismaMock.notification.deleteMany).toHaveBeenCalledOnce()
      expect(prismaMock.notification.updateMany).not.toHaveBeenCalled()

      // Verify the where clause uses createdAt filter
      const call = prismaMock.notification.deleteMany.mock.calls[0][0]
      expect(call.where).toHaveProperty('createdAt')
    })

    it('soft-deletes expired Payment records using createdAt', async () => {
      prismaMock.retentionPolicy.findMany.mockResolvedValue([
        { entity: 'Payment', retentionDays: 1825, anchor: 'CREATED_AT', isActive: true },
      ])
      prismaMock.payment.updateMany.mockResolvedValue({ count: 5 })

      const results = await runRetentionSweep()

      expect(results[0]).toEqual({ entity: 'Payment', affected: 5 })
      const call = prismaMock.payment.updateMany.mock.calls[0][0]
      expect(call.where).toHaveProperty('createdAt')
    })
  })

  // ─── runRetentionSweep — GRADUATION anchor ────────────────────────
  describe('runRetentionSweep (GRADUATION anchor)', () => {
    it('sweeps Enrollment records only for graduated students past cutoff', async () => {
      prismaMock.retentionPolicy.findMany.mockResolvedValue([
        { entity: 'Enrollment', retentionDays: 2555, anchor: 'GRADUATION', isActive: true },
      ])
      prismaMock.studentProfile.findMany.mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
      ])
      prismaMock.enrollment.updateMany.mockResolvedValue({ count: 3 })

      const results = await runRetentionSweep()

      expect(results[0]).toEqual({ entity: 'Enrollment', affected: 3 })

      // Verify it looked up graduated students
      expect(prismaMock.studentProfile.findMany).toHaveBeenCalledOnce()
      const profileCall = prismaMock.studentProfile.findMany.mock.calls[0][0]
      expect(profileCall.where.graduationDate).toHaveProperty('lt')
      expect(profileCall.select).toEqual({ userId: true })

      // Verify it only swept records for those graduated users
      const enrollmentCall = prismaMock.enrollment.updateMany.mock.calls[0][0]
      expect(enrollmentCall.where.userId).toEqual({ in: ['user-1', 'user-2'] })
      expect(enrollmentCall.where.deletedAt).toBeNull()
    })

    it('returns 0 affected when no students have graduated past cutoff', async () => {
      prismaMock.retentionPolicy.findMany.mockResolvedValue([
        { entity: 'Grade', retentionDays: 2555, anchor: 'GRADUATION', isActive: true },
      ])
      prismaMock.studentProfile.findMany.mockResolvedValue([])

      const results = await runRetentionSweep()

      expect(results[0]).toEqual({ entity: 'Grade', affected: 0 })
      // Should NOT call updateMany when there are no graduated users
      expect(prismaMock.grade.updateMany).not.toHaveBeenCalled()
    })

    it('sweeps ExamResult records for graduated students', async () => {
      prismaMock.retentionPolicy.findMany.mockResolvedValue([
        { entity: 'ExamResult', retentionDays: 2555, anchor: 'GRADUATION', isActive: true },
      ])
      prismaMock.studentProfile.findMany.mockResolvedValue([
        { userId: 'user-99' },
      ])
      prismaMock.examResult.updateMany.mockResolvedValue({ count: 10 })

      const results = await runRetentionSweep()

      expect(results[0]).toEqual({ entity: 'ExamResult', affected: 10 })
      const call = prismaMock.examResult.updateMany.mock.calls[0][0]
      expect(call.where.userId).toEqual({ in: ['user-99'] })
    })
  })

  // ─── Safety guards ────────────────────────────────────────────────
  describe('Safety guards', () => {
    it('refuses to process entities not in SOFT_DELETABLE_MODELS', async () => {
      prismaMock.retentionPolicy.findMany.mockResolvedValue([
        { entity: 'Wallet', retentionDays: 1825, anchor: 'UPDATED_AT', isActive: true },
      ])

      const results = await runRetentionSweep()

      expect(results[0].affected).toBe(0)
      expect(results[0].error).toContain('SOFT_DELETABLE_MODELS')
      // Must NOT call deleteMany or updateMany
      expect(prismaMock.wallet.deleteMany).not.toHaveBeenCalled()
      expect(prismaMock.wallet.updateMany).not.toHaveBeenCalled()
    })

    it('refuses to process AuditLog (no deletedAt column)', async () => {
      prismaMock.retentionPolicy.findMany.mockResolvedValue([
        { entity: 'AuditLog', retentionDays: 2555, anchor: 'CREATED_AT', isActive: true },
      ])

      const results = await runRetentionSweep()

      expect(results[0].affected).toBe(0)
      expect(results[0].error).toContain('SOFT_DELETABLE_MODELS')
      expect(prismaMock.auditLog.deleteMany).not.toHaveBeenCalled()
    })

    it('reports error for unknown entity without crashing sweep', async () => {
      prismaMock.retentionPolicy.findMany.mockResolvedValue([
        { entity: 'NonExistentModel', retentionDays: 365, anchor: 'CREATED_AT', isActive: true },
      ])

      const results = await runRetentionSweep()

      expect(results[0].affected).toBe(0)
      expect(results[0].error).toBeDefined()
      expect(results[0].error).toContain('NonExistentModel')
    })

    it('continues processing other policies when one fails', async () => {
      prismaMock.retentionPolicy.findMany.mockResolvedValue([
        { entity: 'Wallet', retentionDays: 1825, anchor: 'UPDATED_AT', isActive: true },
        { entity: 'Payment', retentionDays: 1825, anchor: 'CREATED_AT', isActive: true },
      ])
      prismaMock.payment.updateMany.mockResolvedValue({ count: 2 })

      const results = await runRetentionSweep()

      expect(results).toHaveLength(2)
      // First policy (Wallet) should fail
      expect(results[0].error).toBeDefined()
      // Second policy (Payment) should succeed
      expect(results[1]).toEqual({ entity: 'Payment', affected: 2 })
    })
  })

  // ─── No policies / inactive ───────────────────────────────────────
  describe('Edge cases', () => {
    it('returns empty array when no active policies exist', async () => {
      prismaMock.retentionPolicy.findMany.mockResolvedValue([])

      const results = await runRetentionSweep()

      expect(results).toEqual([])
    })
  })
})
