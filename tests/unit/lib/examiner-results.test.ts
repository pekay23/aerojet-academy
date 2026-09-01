import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { submitExaminerResults } from '@/app/examiner/results/actions'

vi.mock('@/lib/auth/helpers', () => ({
  requireExaminer: vi.fn(),
}))

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  AuditAction: { CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE' },
}))

vi.mock('@/lib/analytics/events', () => ({
  trackExamCompletion: vi.fn(() => Promise.resolve(undefined)),
}))

import { requireExaminer } from '@/lib/auth/helpers'

describe('submitExaminerResults', () => {
  const mockUser = { id: 'user-1', name: 'Test Examiner' }
  const mockExaminer = { id: 'examiner-1' }
  const mockSitting = {
    id: 'sitting-1',
    examinerId: 'examiner-1',
    examComponent: { course: { code: 'M1' } },
    assignments: [
      { id: 'assign-1', userId: 'candidate-1', bookingId: 'booking-1', booking: { examId: null, moduleCode: 'M1' } },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireExaminer as any).mockResolvedValue(mockUser)
    prismaMock.examiner.findUnique.mockResolvedValue(mockExaminer)
    prismaMock.examSitting.findUnique.mockResolvedValue(mockSitting)
    prismaMock.examResult.findMany.mockResolvedValue([])
    prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock))
    prismaMock.examResult.createMany.mockResolvedValue({ count: 1 } as any)
    prismaMock.examResult.update.mockResolvedValue({} as any)
    prismaMock.examResult.deleteMany.mockResolvedValue({} as any)
    prismaMock.examSittingAssignment.updateMany.mockResolvedValue({} as any)
    prismaMock.examSittingAssignment.update.mockResolvedValue({} as any)
  })

  it('returns error when examiner profile not found', async () => {
    prismaMock.examiner.findUnique.mockResolvedValueOnce(null)
    const res = await submitExaminerResults('sitting-1', [])
    expect(res.error).toBe('Examiner profile not found.')
  })

  it('returns error when sitting not found', async () => {
    prismaMock.examSitting.findUnique.mockResolvedValueOnce(null)
    const res = await submitExaminerResults('sitting-1', [])
    expect(res.error).toBe('Sitting not found.')
  })

  it('returns error when not assigned to sitting', async () => {
    prismaMock.examSitting.findUnique.mockResolvedValueOnce({ ...mockSitting, examinerId: 'other' })
    const res = await submitExaminerResults('sitting-1', [])
    expect(res.error).toBe('You are not assigned to this sitting.')
  })

  it('records results for valid entries', async () => {
    const entries = [{ assignmentId: 'assign-1', score: 85, absent: false }]
    const res = await submitExaminerResults('sitting-1', entries)
    if ((res as any).error) {
      console.log('Error in records test:', (res as any).error)
    }
    expect((res as any).success).toBe(true)
    expect((res as any).recorded).toBe(1)
    expect(prismaMock.examResult.createMany).toHaveBeenCalled()
  })

  it('marks absent candidates', async () => {
    const entries = [{ assignmentId: 'assign-1', absent: true, score: null }]
    const res = await submitExaminerResults('sitting-1', entries)
    expect((res as any).success).toBe(true)
    expect((res as any).recorded).toBe(0)
  })

  it('clamps score to 0-100 range', async () => {
    prismaMock.examResult.findMany.mockResolvedValue([])
    const entries = [{ assignmentId: 'assign-1', score: 150, absent: false }]
    const res = await submitExaminerResults('sitting-1', entries)
    if ((res as any).error) {
      console.log('Error in clamp test:', (res as any).error)
    }
    const createCall = (prismaMock.examResult.createMany as any).mock.calls[0]?.[0]
    expect(createCall?.data?.[0]?.score).toBe(100)
  })

  it('clears previously submitted results when score is removed', async () => {
    prismaMock.examResult.findMany.mockResolvedValue([
      { id: 'result-1', userId: 'candidate-1', moduleCode: 'M1', examId: null },
    ])
    const entries = [{ assignmentId: 'assign-1', score: null, absent: false }]
    const res = await submitExaminerResults('sitting-1', entries)
    expect((res as any).success).toBe(true)
    expect(prismaMock.examResult.deleteMany).toHaveBeenCalled()
  })

  it('returns error for invalid entries', async () => {
    const res = await submitExaminerResults('sitting-1', [])
    expect(res.error).toBe('No valid entries provided.')
  })
})
