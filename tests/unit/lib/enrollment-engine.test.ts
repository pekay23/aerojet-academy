import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { autoEnrollStudent } from '@/lib/enrollment/engine'

// Mock deduplication and analytics
vi.mock('@/lib/enrollment/deduplication', () => ({
  getDeduplicatedModulesForStudent: vi.fn(),
}))

vi.mock('@/lib/analytics/events', () => ({
  trackEnrollment: vi.fn().mockResolvedValue(undefined),
}))

import { getDeduplicatedModulesForStudent } from '@/lib/enrollment/deduplication'
import { trackEnrollment } from '@/lib/analytics/events'

describe('autoEnrollStudent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('throws when profile or pathway is missing', async () => {
    prismaMock.studentProfile.findUnique.mockResolvedValue(null)

    await expect(autoEnrollStudent('sp-1')).rejects.toThrow('Student profile or relational pathway not found')
  })

  it('returns 0 when pathway does not require auto-enrollment', async () => {
    prismaMock.studentProfile.findUnique.mockResolvedValue({
      id: 'sp-1',
      userId: 'user-1',
      pathwayRel: { requiresAutoEnrollment: false, code: 'MODULAR' },
      academicYearId: 'ay-1',
      semesterId: 'sem-1',
    })

    const result = await autoEnrollStudent('sp-1')

    expect(result).toBe(0)
  })

  it('returns 0 when no academic term matches current year/semester', async () => {
    prismaMock.studentProfile.findUnique.mockResolvedValue({
      id: 'sp-1',
      userId: 'user-1',
      currentYearNumber: 1,
      currentSemesterNumber: 1,
      pathwayRel: {
        requiresAutoEnrollment: true,
        code: 'FULL_TIME',
        academicTerms: [
          { yearNumber: 2, semesterNumber: 1, courseAssignments: [] },
        ],
      },
      academicYearId: 'ay-1',
      semesterId: 'sem-1',
    })

    const result = await autoEnrollStudent('sp-1')

    expect(result).toBe(0)
  })

  it('enrolls student in modules for matching term', async () => {
    prismaMock.studentProfile.findUnique.mockResolvedValue({
      id: 'sp-1',
      userId: 'user-1',
      currentYearNumber: 1,
      currentSemesterNumber: 1,
      pathwayRel: {
        requiresAutoEnrollment: true,
        code: 'FULL_TIME',
        academicTerms: [
          {
            yearNumber: 1,
            semesterNumber: 1,
            courseAssignments: [
              { courseId: 'c1' },
              { courseId: 'c2' },
            ],
          },
        ],
      },
      academicYearId: 'ay-1',
      semesterId: 'sem-1',
    })

    ;(getDeduplicatedModulesForStudent as any).mockResolvedValue({
      modules: [
        { id: 'c1', name: 'Module A', price: 1000, currency: 'EUR', code: 'A' },
        { id: 'c3', name: 'Module C', price: 3000, currency: 'EUR', code: 'C' },
      ],
      totalPrice: 4000,
      currency: 'EUR',
    })

    prismaMock.enrollment.findFirst
      .mockResolvedValueOnce(null) // c1 not enrolled
      .mockResolvedValueOnce({ id: 'enroll-2' }) // c2 already enrolled

    prismaMock.enrollment.create
      .mockResolvedValueOnce({ id: 'enroll-1', courseId: 'c1' })

    const result = await autoEnrollStudent('sp-1')

    expect(result).toBe(1)
    expect(prismaMock.enrollment.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        courseId: 'c1',
        status: 'ENROLLED',
        amountPaid: 1000,
        academicYearId: 'ay-1',
        semesterId: 'sem-1',
      },
    })
    expect(trackEnrollment).toHaveBeenCalledWith('enroll-1', 'c1', 'A', 'user-1')
  })

  it('skips modules student is already enrolled in', async () => {
    prismaMock.studentProfile.findUnique.mockResolvedValue({
      id: 'sp-1',
      userId: 'user-1',
      currentYearNumber: 1,
      currentSemesterNumber: 1,
      pathwayRel: {
        requiresAutoEnrollment: true,
        code: 'FULL_TIME',
        academicTerms: [
          {
            yearNumber: 1,
            semesterNumber: 1,
            courseAssignments: [
              { courseId: 'c1' },
            ],
          },
        ],
      },
      academicYearId: 'ay-1',
      semesterId: 'sem-1',
    })

    ;(getDeduplicatedModulesForStudent as any).mockResolvedValue({
      modules: [{ id: 'c1', name: 'Module A', price: 1000, currency: 'EUR', code: 'A' }],
      totalPrice: 1000,
      currency: 'EUR',
    })

    prismaMock.enrollment.findFirst.mockResolvedValue({ id: 'existing-enroll' })

    const result = await autoEnrollStudent('sp-1')

    expect(result).toBe(0)
    expect(prismaMock.enrollment.create).not.toHaveBeenCalled()
  })
})
