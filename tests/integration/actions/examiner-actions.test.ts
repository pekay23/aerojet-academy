import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: any) => fn),
}))
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

const mockRequireExaminer = vi.fn()
vi.mock('@/lib/auth/helpers', () => ({
  requireExaminer: () => mockRequireExaminer(),
}))
vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn().mockResolvedValue(undefined),
  AuditAction: { CREATE: 'CREATE' },
}))
vi.mock('@/lib/analytics/events', () => ({
  trackExamCompletion: vi.fn(() => Promise.resolve()),
}))

import { submitExaminerResults } from '@/app/examiner/results/actions'

const sitting = {
  id: 'sitting-1',
  examinerId: 'examiner-1',
  examComponent: { course: { code: 'MOD1' } },
  assignments: [
    { id: 'a-1', userId: 'u-1', bookingId: 'b-1', booking: { examId: 'exam-1', moduleCode: 'MOD1' } },
    { id: 'a-2', userId: 'u-2', bookingId: 'b-2', booking: { examId: null, moduleCode: 'MOD2' } },
  ],
}

describe('submitExaminerResults', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockRequireExaminer.mockResolvedValue({ id: 'examiner-user', name: 'Examiner Name' })
  })

  it('returns an error when the examiner is not authenticated', async () => {
    mockRequireExaminer.mockRejectedValue(new Error('Unauthorized'))
    const res = await submitExaminerResults('sitting-1', [])
    expect(res.error).toBeDefined()
  })

  it('returns an error when the sitting is not found', async () => {
    prismaMock.examiner.findUnique.mockResolvedValue({ id: 'examiner-1' })
    prismaMock.examSitting.findUnique.mockResolvedValue(null)
    const res = await submitExaminerResults('sitting-1', [])
    expect(res.error).toBe('Sitting not found.')
  })

  it('returns an error when the examiner is not assigned to the sitting', async () => {
    prismaMock.examiner.findUnique.mockResolvedValue({ id: 'examiner-1' })
    prismaMock.examSitting.findUnique.mockResolvedValue({ ...sitting, examinerId: 'other-examiner' })
    const res = await submitExaminerResults('sitting-1', [])
    expect(res.error).toBe('You are not assigned to this sitting.')
  })

  it('records new results and creates them in bulk', async () => {
    prismaMock.examiner.findUnique.mockResolvedValue({ id: 'examiner-1' })
    prismaMock.examSitting.findUnique.mockResolvedValue(sitting)
    prismaMock.examResult.findMany.mockResolvedValue([])

    const res = await submitExaminerResults('sitting-1', [
      { assignmentId: 'a-1', score: 85, absent: false },
      { assignmentId: 'a-2', score: null, absent: true },
    ])

    expect(res.error).toBeUndefined()
    expect(res.recorded).toBe(1)
    expect(prismaMock.examResult.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          userId: 'u-1',
          score: 85,
          passed: true,
          moduleCode: 'MOD1',
          examCategory: 'OFFICIAL_EASA',
        }),
      ]),
    })
    // M-5: present candidates are marked PRESENT, absent candidates reset to PENDING
    expect(prismaMock.examSittingAssignment.updateMany).toHaveBeenCalled()
  })

  it('clamps out-of-range scores before persisting', async () => {
    prismaMock.examiner.findUnique.mockResolvedValue({ id: 'examiner-1' })
    prismaMock.examSitting.findUnique.mockResolvedValue(sitting)
    prismaMock.examResult.findMany.mockResolvedValue([])

    const res = await submitExaminerResults('sitting-1', [
      { assignmentId: 'a-1', score: 150, absent: false },
    ])

    expect(res.error).toBeUndefined()
    expect(prismaMock.examResult.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ userId: 'u-1', score: 100, passed: true }),
      ]),
    })
  })

  it('clears previously submitted results when a score is removed', async () => {
    prismaMock.examiner.findUnique.mockResolvedValue({ id: 'examiner-1' })
    prismaMock.examSitting.findUnique.mockResolvedValue(sitting)
    prismaMock.examResult.findMany.mockResolvedValue([
      { id: 'r-1', userId: 'u-1', moduleCode: 'MOD1', examId: 'exam-1' },
    ])

    const res = await submitExaminerResults('sitting-1', [
      { assignmentId: 'a-1', score: null, absent: false },
      { assignmentId: 'a-2', score: null, absent: true },
    ])

    expect(res.error).toBeUndefined()
    // Both the cleared (blank) and absent entries purge any existing result.
    expect(prismaMock.examResult.deleteMany).toHaveBeenCalled()
  })
})
