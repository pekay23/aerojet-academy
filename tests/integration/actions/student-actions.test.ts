import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { enrollInCourse, joinExamPool, changePassword } from '@/app/student/actions'

// Mock server-only and next/cache
vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock auth helpers
const mockRequireStudent = vi.fn()
const mockRequireAuth = vi.fn()
vi.mock('@/lib/auth/helpers', () => ({
  requireAuth: () => mockRequireAuth(),
  requireStudent: () => mockRequireStudent(),
}))

// Mock assertExamOnlyPathway to pass through
vi.mock('@/lib/pools/access-control', () => ({
  assertExamOnlyPathway: vi.fn().mockResolvedValue(undefined),
}))

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('$2a$10$hashedpassword'),
  compare: vi.fn(),
}))

describe('Student Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireStudent.mockResolvedValue({ id: 'student-1', email: 'student@test.com' })
    mockRequireAuth.mockResolvedValue({ id: 'student-1', email: 'student@test.com' })
  })

  describe('enrollInCourse', () => {
    it('returns error when course is not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'student-1',
        status: 'ACTIVE',
        registrationPaid: true,
      })
      prismaMock.course.findUnique.mockResolvedValue(null)

      const result = await enrollInCourse('nonexistent-course')

      expect(result.error).toBe('Course not found')
    })

    it('returns error when student profile is not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'student-1',
        status: 'ACTIVE',
        registrationPaid: true,
      })
      prismaMock.course.findUnique.mockResolvedValue({ id: 'course-1', price: 1000 })
      prismaMock.studentProfile.findUnique.mockResolvedValue(null)

      const result = await enrollInCourse('course-1')

      expect(result.error).toBe('Student profile not found.')
    })

    it('returns error when already enrolled', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'student-1',
        status: 'ACTIVE',
        registrationPaid: true,
      })
      prismaMock.course.findUnique.mockResolvedValue({ id: 'course-1', price: 1000 })
      prismaMock.studentProfile.findUnique.mockResolvedValue({
        userId: 'student-1',
        enrollmentType: 'MODULAR',
        pathwayRel: null,
        programmeChoice: null,
      })
      prismaMock.enrollment.findFirst.mockResolvedValue({ id: 'enroll-1' })

      const result = await enrollInCourse('course-1')

      expect(result.error).toBe('You are already enrolled or have a pending enrollment for this course.')
    })

    it('returns error when user is not active', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'student-1',
        status: 'SUSPENDED',
        registrationPaid: true,
      })

      const result = await enrollInCourse('course-1')

      expect(result.error).toBe('Your account is not active. Please contact support.')
    })

    it('returns error when registration is not paid', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'student-1',
        status: 'ACTIVE',
        registrationPaid: false,
      })

      const result = await enrollInCourse('course-1')

      expect(result.error).toContain('Registration fee not paid')
    })
  })

  describe('joinExamPool', () => {
    it('returns error when module is not selected', async () => {
      const result = await joinExamPool('pool-1', '')

      expect(result.error).toBe('You must select a module before joining a booking.')
    })

    it('returns error when pool is not found', async () => {
      prismaMock.examPool.findUnique.mockResolvedValue(null)

      const result = await joinExamPool('nonexistent-pool', 'MOD-001')

      expect(result.error).toBe('Exam booking not found.')
    })

    it('returns error when pool is closed', async () => {
      prismaMock.examPool.findUnique.mockResolvedValue({
        id: 'pool-1',
        status: 'LOCKED',
        poolType: 'STANDARD',
        eventId: 'event-1',
      })

      const result = await joinExamPool('pool-1', 'MOD-001')

      expect(result.error).toBe('This exam booking is no longer accepting new members.')
    })
  })

  describe('changePassword', () => {
    it('returns error when current password is incorrect', async () => {
      const { compare } = await import('bcryptjs')
      vi.mocked(compare).mockResolvedValue(false)

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'student-1',
        password: '$2a$10$hashedpassword',
      })

      const result = await changePassword('wrong-password', 'new-password')

      expect(result.error).toBe('Incorrect current password.')
    })

    it('returns error when new password is too short', async () => {
      const result = await changePassword('old-password', '123')

      expect(result.error).toContain('password')
    })
  })
})
