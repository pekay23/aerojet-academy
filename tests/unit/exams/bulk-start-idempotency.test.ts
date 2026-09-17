import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma/client', () => {
  const fn = () => vi.fn()
  const core: any = {
    class: { findUnique: fn() },
    internalExamBank: { findUnique: fn() },
    internalExamClassSchedule: { findFirst: fn() },
    enrollment: { findMany: fn() },
    internalExamSession: { findFirst: fn(), create: fn() },
  }
  core.$transaction = fn()
  return { default: core, prismaUnfiltered: core }
})

vi.mock('@/lib/auth/helpers', () => ({
  requireInstructor: vi.fn(),
}))

vi.mock('@/lib/instructor/profile', () => ({
  getInstructorProfileByUserId: vi.fn(),
}))

vi.mock('@/lib/internal-exam/engine', () => ({
  isInternalExamSystemEnabled: vi.fn(),
  getBankRules: vi.fn(),
}))

vi.mock('@/lib/security/rate-limit', () => ({
  rateLimitByUser: vi.fn(() => ({ allowed: true, remaining: 0, resetAt: Date.now() + 60000 })),
  clearRateLimit: vi.fn(),
}))

vi.mock('@/lib/audit/logger', () => ({
  AuditAction: {},
  createAuditLog: vi.fn(),
}))

const prismaMock: any = (await import('@/lib/prisma/client')).prismaUnfiltered
const requireInstructor: any = (await import('@/lib/auth/helpers')).requireInstructor
const getInstructorProfileByUserId: any = (await import('@/lib/instructor/profile'))
  .getInstructorProfileByUserId
const { isInternalExamSystemEnabled, getBankRules }: any =
  await import('@/lib/internal-exam/engine')

beforeEach(() => {
  vi.resetAllMocks()
})

describe('bulk-start idempotency', () => {
  it('creates one session per student when none exist', async () => {
    requireInstructor.mockResolvedValue({ id: 'inst-1', name: 'Inst' })
    getInstructorProfileByUserId.mockResolvedValue({ id: 'prof-1' })
    isInternalExamSystemEnabled.mockResolvedValue(true)

    prismaMock.class.findUnique.mockResolvedValue({
      id: 'class-1',
      instructorId: 'prof-1',
      courseId: 'course-1',
      name: 'Class 1',
    })
    prismaMock.internalExamClassSchedule.findFirst.mockResolvedValue({ bankId: 'bank-1' })
    prismaMock.internalExamBank.findUnique.mockResolvedValue({
      id: 'bank-1',
      name: 'Bank 1',
      mcqCount: 40,
      ruleSet: 'EASA',
    })
    getBankRules.mockResolvedValue({ timePerQuestionSecs: 75 })

    prismaMock.enrollment.findMany.mockResolvedValue([
      { userId: 's1' },
      { userId: 's2' },
      { userId: 's3' },
    ])

    prismaMock.internalExamSession.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)

    prismaMock.internalExamSession.create.mockResolvedValue({ id: 'session-1' })

    const { POST } = await import('@/app/api/instructor/exams/classes/[classId]/start/route')
    const req = { json: () => Promise.resolve({}) } as any
    const ctx = { params: Promise.resolve({ classId: 'class-1' }) }
    const res = await POST(req, ctx as any)

    expect(res).toBeDefined()
    const json = await res.json()
    expect(json.data.started).toBe(3)
    expect(json.data.skipped).toBe(0)
    expect(json.data.failed).toBe(0)
  })

  it('skips existing non-voided sessions on re-run', async () => {
    requireInstructor.mockResolvedValue({ id: 'inst-1', name: 'Inst' })
    getInstructorProfileByUserId.mockResolvedValue({ id: 'prof-1' })
    isInternalExamSystemEnabled.mockResolvedValue(true)

    prismaMock.class.findUnique.mockResolvedValue({
      id: 'class-1',
      instructorId: 'prof-1',
      courseId: 'course-1',
      name: 'Class 1',
    })
    prismaMock.internalExamClassSchedule.findFirst.mockResolvedValue({ bankId: 'bank-1' })
    prismaMock.internalExamBank.findUnique.mockResolvedValue({
      id: 'bank-1',
      name: 'Bank 1',
      mcqCount: 40,
      ruleSet: 'EASA',
    })
    getBankRules.mockResolvedValue({ timePerQuestionSecs: 75 })

    prismaMock.enrollment.findMany.mockResolvedValue([{ userId: 's1' }, { userId: 's2' }])

    prismaMock.internalExamSession.findFirst
      .mockResolvedValueOnce({ id: 'existing-1', status: 'IN_PROGRESS' })
      .mockResolvedValueOnce(null)

    prismaMock.internalExamSession.create.mockResolvedValue({ id: 'session-2' })

    const { POST } = await import('@/app/api/instructor/exams/classes/[classId]/start/route')
    const req = { json: () => Promise.resolve({}) } as any
    const ctx = { params: Promise.resolve({ classId: 'class-1' }) }
    const res = await POST(req, ctx as any)

    const json = await res.json()
    expect(json.data.started).toBe(1)
    expect(json.data.skipped).toBe(1)
  })

  it('recreates voided sessions', async () => {
    requireInstructor.mockResolvedValue({ id: 'inst-1', name: 'Inst' })
    getInstructorProfileByUserId.mockResolvedValue({ id: 'prof-1' })
    isInternalExamSystemEnabled.mockResolvedValue(true)

    prismaMock.class.findUnique.mockResolvedValue({
      id: 'class-1',
      instructorId: 'prof-1',
      courseId: 'course-1',
      name: 'Class 1',
    })
    prismaMock.internalExamClassSchedule.findFirst.mockResolvedValue({ bankId: 'bank-1' })
    prismaMock.internalExamBank.findUnique.mockResolvedValue({
      id: 'bank-1',
      name: 'Bank 1',
      mcqCount: 40,
      ruleSet: 'EASA',
    })
    getBankRules.mockResolvedValue({ timePerQuestionSecs: 75 })

    prismaMock.enrollment.findMany.mockResolvedValue([{ userId: 's1' }])

    // The route queries with status: { not: 'VOIDED' }, so a voided session
    // is filtered out by the DB — the mock should return null to signal "no
    // active session found", prompting the route to create a new one.
    prismaMock.internalExamSession.findFirst.mockResolvedValueOnce(null)
    prismaMock.internalExamSession.create.mockResolvedValue({ id: 'new-session' })

    const { POST } = await import('@/app/api/instructor/exams/classes/[classId]/start/route')
    const req = { json: () => Promise.resolve({}) } as any
    const ctx = { params: Promise.resolve({ classId: 'class-1' }) }
    const res = await POST(req, ctx as any)

    const json = await res.json()
    expect(json.data.started).toBe(1)
    expect(json.data.skipped).toBe(0)
  })

  it('handles partial create failure gracefully', async () => {
    requireInstructor.mockResolvedValue({ id: 'inst-1', name: 'Inst' })
    getInstructorProfileByUserId.mockResolvedValue({ id: 'prof-1' })
    isInternalExamSystemEnabled.mockResolvedValue(true)

    prismaMock.class.findUnique.mockResolvedValue({
      id: 'class-1',
      instructorId: 'prof-1',
      courseId: 'course-1',
      name: 'Class 1',
    })
    prismaMock.internalExamClassSchedule.findFirst.mockResolvedValue({ bankId: 'bank-1' })
    prismaMock.internalExamBank.findUnique.mockResolvedValue({
      id: 'bank-1',
      name: 'Bank 1',
      mcqCount: 40,
      ruleSet: 'EASA',
    })
    getBankRules.mockResolvedValue({ timePerQuestionSecs: 75 })

    prismaMock.enrollment.findMany.mockResolvedValue([{ userId: 's1' }, { userId: 's2' }])

    prismaMock.internalExamSession.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null)

    prismaMock.internalExamSession.create
      .mockResolvedValueOnce({ id: 'session-1' })
      .mockRejectedValueOnce(new Error('DB error'))

    const { POST } = await import('@/app/api/instructor/exams/classes/[classId]/start/route')
    const req = { json: () => Promise.resolve({}) } as any
    const ctx = { params: Promise.resolve({ classId: 'class-1' }) }
    const res = await POST(req, ctx as any)

    const json = await res.json()
    expect(json.data.started).toBe(1)
    expect(json.data.failed).toBe(1)
  })
})
