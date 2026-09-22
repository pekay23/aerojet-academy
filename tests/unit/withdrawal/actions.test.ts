import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'

// Mock server-only and next/cache
vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock auth helpers
const mockRequireAuth = vi.fn()
const mockRequireStaff = vi.fn()
const mockRequireAdmin = vi.fn()

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireAuth: () => mockRequireAuth(),
  requireStaff: () => mockRequireStaff(),
  requireAdmin: () => mockRequireAdmin(),
}))

// Mock audit logger
vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(() => Promise.resolve()),
  AuditAction: { CREATE: 'CREATE', UPDATE: 'UPDATE' },
}))

// Import after mocks are set up
import {
  requestWithdrawal,
  staffInitiateWithdrawal,
  staffConfirmWithdrawal,
  rejectWithdrawal,
  adminApproveWithdrawal,
} from '@/lib/withdrawal/actions'

describe('withdrawal actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('requestWithdrawal', () => {
    it('creates a withdrawal request for authenticated student', async () => {
      mockRequireAuth.mockResolvedValue({ id: 'student-1', email: 'student@test.com' })
      prismaMock.withdrawalRequest.findFirst.mockResolvedValue(null)
      prismaMock.withdrawalRequest.create.mockResolvedValue({
        id: 'wr-1',
        userId: 'student-1',
        reason: 'Personal reasons',
        status: 'REQUESTED',
      })

      const result = await requestWithdrawal('Personal reasons')

      expect(result.success).toBe(true)
      expect(prismaMock.withdrawalRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'student-1',
            reason: 'Personal reasons',
            requestedById: 'student-1',
            status: 'REQUESTED',
          }),
        })
      )
    })

    it('rejects when no reason provided', async () => {
      mockRequireAuth.mockResolvedValue({ id: 'student-1', email: 'student@test.com' })

      const result = await requestWithdrawal('')

      expect(result.error).toBe('Please provide a reason for withdrawal.')
    })

    it('rejects when student already has open request', async () => {
      mockRequireAuth.mockResolvedValue({ id: 'student-1', email: 'student@test.com' })
      prismaMock.withdrawalRequest.findFirst.mockResolvedValue({ id: 'wr-existing' })

      const result = await requestWithdrawal('Personal reasons')

      expect(result.error).toBe('You already have a withdrawal request in progress.')
    })

    it('returns 401 when not authenticated', async () => {
      mockRequireAuth.mockRejectedValue(new Error('Unauthorized'))

      const result = await requestWithdrawal('Personal reasons')

      expect(result.error).toBe('Failed to submit withdrawal request.')
    })
  })

  describe('staffInitiateWithdrawal', () => {
    it('creates a withdrawal request on behalf of a student', async () => {
      mockRequireStaff.mockResolvedValue({ id: 'staff-1', email: 'staff@test.com' })
      prismaMock.withdrawalRequest.findFirst.mockResolvedValue(null)
      prismaMock.withdrawalRequest.create.mockResolvedValue({
        id: 'wr-1',
        userId: 'student-1',
        reason: 'Academic reasons',
        status: 'REQUESTED',
      })

      const result = await staffInitiateWithdrawal('student-1', 'Academic reasons')

      expect(result.success).toBe(true)
      expect(prismaMock.withdrawalRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'student-1',
            reason: 'Academic reasons',
            requestedById: 'staff-1',
            status: 'REQUESTED',
          }),
        })
      )
    })

    it('rejects when no reason provided', async () => {
      mockRequireStaff.mockResolvedValue({ id: 'staff-1' })

      const result = await staffInitiateWithdrawal('student-1', '')

      expect(result.error).toBe('A reason is required.')
    })

    it('rejects when student already has open request', async () => {
      mockRequireStaff.mockResolvedValue({ id: 'staff-1' })
      prismaMock.withdrawalRequest.findFirst.mockResolvedValue({ id: 'wr-existing' })

      const result = await staffInitiateWithdrawal('student-1', 'Academic reasons')

      expect(result.error).toBe('This student already has a withdrawal request in progress.')
    })

    it('returns error when not authenticated as staff', async () => {
      mockRequireStaff.mockRejectedValue(new Error('Unauthorized'))

      const result = await staffInitiateWithdrawal('student-1', 'Academic reasons')

      expect(result.error).toBe('Failed to initiate withdrawal.')
    })
  })

  describe('staffConfirmWithdrawal', () => {
    it('confirms a requested withdrawal', async () => {
      mockRequireStaff.mockResolvedValue({ id: 'staff-1', email: 'staff@test.com' })
      prismaMock.withdrawalRequest.findUnique.mockResolvedValue({
        id: 'wr-1',
        status: 'REQUESTED',
      })
      prismaMock.withdrawalRequest.update.mockResolvedValue({
        id: 'wr-1',
        status: 'STAFF_CONFIRMED',
      })

      const result = await staffConfirmWithdrawal('wr-1')

      expect(result.success).toBe(true)
      expect(prismaMock.withdrawalRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'wr-1' },
          data: expect.objectContaining({
            status: 'STAFF_CONFIRMED',
            staffConfirmedById: 'staff-1',
          }),
        })
      )
    })

    it('rejects when request not found', async () => {
      mockRequireStaff.mockResolvedValue({ id: 'staff-1' })
      prismaMock.withdrawalRequest.findUnique.mockResolvedValue(null)

      const result = await staffConfirmWithdrawal('wr-999')

      expect(result.error).toBe('Request not found.')
    })

    it('rejects when status is not REQUESTED', async () => {
      mockRequireStaff.mockResolvedValue({ id: 'staff-1' })
      prismaMock.withdrawalRequest.findUnique.mockResolvedValue({
        id: 'wr-1',
        status: 'STAFF_CONFIRMED',
      })

      const result = await staffConfirmWithdrawal('wr-1')

      expect(result.error).toBe('Only requested withdrawals can be confirmed.')
    })
  })

  describe('rejectWithdrawal', () => {
    it('rejects a withdrawal with a reason', async () => {
      mockRequireStaff.mockResolvedValue({ id: 'staff-1', email: 'staff@test.com' })
      prismaMock.withdrawalRequest.findUnique.mockResolvedValue({
        id: 'wr-1',
        status: 'REQUESTED',
      })
      prismaMock.withdrawalRequest.update.mockResolvedValue({
        id: 'wr-1',
        status: 'REJECTED',
      })

      const result = await rejectWithdrawal('wr-1', 'Insufficient documentation')

      expect(result.success).toBe(true)
      expect(prismaMock.withdrawalRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'wr-1' },
          data: expect.objectContaining({
            status: 'REJECTED',
            rejectedById: 'staff-1',
            rejectedReason: 'Insufficient documentation',
          }),
        })
      )
    })

    it('rejects when no reason provided', async () => {
      mockRequireStaff.mockResolvedValue({ id: 'staff-1' })
      prismaMock.withdrawalRequest.findUnique.mockResolvedValue({
        id: 'wr-1',
        status: 'REQUESTED',
      })

      const result = await rejectWithdrawal('wr-1', '')

      expect(result.error).toBe('A rejection reason is required.')
    })

    it('rejects when request not in open status', async () => {
      mockRequireStaff.mockResolvedValue({ id: 'staff-1' })
      prismaMock.withdrawalRequest.findUnique.mockResolvedValue({
        id: 'wr-1',
        status: 'COMPLETED',
      })

      const result = await rejectWithdrawal('wr-1', 'Some reason')

      expect(result.error).toBe('This request can no longer be rejected.')
    })

    it('rejects when request not found', async () => {
      mockRequireStaff.mockResolvedValue({ id: 'staff-1' })
      prismaMock.withdrawalRequest.findUnique.mockResolvedValue(null)

      const result = await rejectWithdrawal('wr-999', 'Some reason')

      expect(result.error).toBe('Request not found.')
    })
  })

  describe('adminApproveWithdrawal', () => {
    it('approves a staff-confirmed withdrawal', async () => {
      mockRequireAdmin.mockResolvedValue({ id: 'admin-1', email: 'admin@test.com' })
      prismaMock.withdrawalRequest.findUnique.mockResolvedValue({
        id: 'wr-1',
        status: 'STAFF_CONFIRMED',
        userId: 'student-1',
      })
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        if (typeof fn === 'function') return fn(prismaMock)
        return Promise.resolve(fn)
      })
      prismaMock.withdrawalRequest.update.mockResolvedValue({
        id: 'wr-1',
        status: 'COMPLETED',
      })
      prismaMock.user.update.mockResolvedValue({})
      prismaMock.enrollment.updateMany.mockResolvedValue({ count: 2 })
      prismaMock.fullTimeEnrollment.updateMany.mockResolvedValue({ count: 1 })
      prismaMock.modularEnrollment.updateMany.mockResolvedValue({ count: 1 })

      const result = await adminApproveWithdrawal('wr-1', 'Refund processed')

      expect(result.success).toBe(true)
      expect(prismaMock.withdrawalRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'wr-1' },
          data: expect.objectContaining({
            status: 'COMPLETED',
            adminApprovedById: 'admin-1',
            financialSettlementNotes: 'Refund processed',
          }),
        })
      )
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'student-1' },
          data: { status: 'ARCHIVED' },
        })
      )
    })

    it('approves a requested withdrawal directly (skipping staff confirmation)', async () => {
      mockRequireAdmin.mockResolvedValue({ id: 'admin-1' })
      prismaMock.withdrawalRequest.findUnique.mockResolvedValue({
        id: 'wr-1',
        status: 'REQUESTED',
        userId: 'student-1',
      })
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        if (typeof fn === 'function') return fn(prismaMock)
        return Promise.resolve(fn)
      })
      prismaMock.withdrawalRequest.update.mockResolvedValue({})
      prismaMock.user.update.mockResolvedValue({})
      prismaMock.enrollment.updateMany.mockResolvedValue({ count: 0 })
      prismaMock.fullTimeEnrollment.updateMany.mockResolvedValue({ count: 0 })
      prismaMock.modularEnrollment.updateMany.mockResolvedValue({ count: 0 })

      const result = await adminApproveWithdrawal('wr-1')

      expect(result.success).toBe(true)
    })

    it('rejects when request not in REQUESTED or STAFF_CONFIRMED', async () => {
      mockRequireAdmin.mockResolvedValue({ id: 'admin-1' })
      prismaMock.withdrawalRequest.findUnique.mockResolvedValue({
        id: 'wr-1',
        status: 'REJECTED',
      })

      const result = await adminApproveWithdrawal('wr-1')

      expect(result.error).toBe('Only requested or staff-confirmed withdrawals can be approved.')
    })

    it('rejects when not authenticated as admin', async () => {
      mockRequireAdmin.mockRejectedValue(new Error('Forbidden'))

      const result = await adminApproveWithdrawal('wr-1')

      expect(result.error).toBe('Failed to approve withdrawal.')
    })
  })
})
