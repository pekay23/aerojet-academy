import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireInstructor: vi.fn(),
  verifyPassword: vi.fn().mockResolvedValue(true),
  hashPassword: vi.fn().mockResolvedValue('$hashed$'),
  generateToken: vi.fn().mockReturnValue('verify-token'),
  generateTempPassword: vi.fn().mockReturnValue('TempPass1!'),
  generateAcademyEmail: vi.fn().mockResolvedValue('j.doe@aerojet-academy.com'),
}))

vi.mock('@/lib/instructor/profile', () => ({
  getInstructorProfileByUserId: vi.fn(),
}))

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  AuditAction: {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
  },
}))

import { GET, POST } from '@/app/api/instructor/classes/[id]/grades/route'
import { requireInstructor } from '@/lib/auth/helpers'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'

const mockUser = { id: 'user-1', role: 'INSTRUCTOR' }
const mockInstructorProfile = { id: 'instructor-1', userId: 'user-1' }
const mockClass = {
  id: 'class-1',
  courseId: 'course-1',
  instructorId: 'instructor-1',
  course: { code: 'CS101', name: 'Intro to CS', category: 'TECH' },
}
const mockEnrollment = {
  id: 'clxyz12340000000000000000',
  userId: 'clxyz12340000000000000001',
  courseId: 'course-1',
  status: 'ENROLLED',
  user: {
    id: 'clxyz12340000000000000001',
    profile: { firstName: 'Alice', lastName: 'Smith' },
  },
  grades: [],
}

const makeGradeBody = (overrides: Record<string, any> = {}) => ({
  enrollmentId: 'clxyz12340000000000000000',
  type: 'ASSIGNMENT',
  title: 'HW1',
  grades: [
    {
      userId: 'clxyz12340000000000000001',
      score: 80,
      maxScore: 100,
      feedback: 'Good work',
      ...overrides,
    },
  ],
  ...overrides,
})

describe('Instructor Grades — GET /api/instructor/classes/[id]/grades', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireInstructor.mockResolvedValue(mockUser)
    getInstructorProfileByUserId.mockResolvedValue(mockInstructorProfile)
  })

  it('returns 401 when unauthenticated', async () => {
    requireInstructor.mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/api/instructor/classes/class-1/grades', { method: 'GET' })
    const res = await GET(req, { params: Promise.resolve({ id: 'class-1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 403 when instructor profile is missing', async () => {
    vi.mocked(getInstructorProfileByUserId).mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/instructor/classes/class-1/grades', { method: 'GET' })
    const res = await GET(req, { params: Promise.resolve({ id: 'class-1' }) })
    expect(res.status).toBe(403)
  })

  it('returns 404 when class not found', async () => {
    prismaMock.class.findUnique.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/instructor/classes/class-1/grades', { method: 'GET' })
    const res = await GET(req, { params: Promise.resolve({ id: 'class-1' }) })
    expect(res.status).toBe(404)
  })

  it('returns 403 when instructor is not assigned to the class', async () => {
    prismaMock.class.findUnique.mockResolvedValueOnce({ ...mockClass, instructorId: 'instructor-other' } as any)
    const req = new NextRequest('http://localhost/api/instructor/classes/class-1/grades', { method: 'GET' })
    const res = await GET(req, { params: Promise.resolve({ id: 'class-1' }) })
    expect(res.status).toBe(403)
  })

  it('returns paginated enrollments with grades', async () => {
    prismaMock.class.findUnique.mockResolvedValueOnce(mockClass as any)
    prismaMock.enrollment.findMany.mockResolvedValueOnce([mockEnrollment] as any)
    prismaMock.enrollment.count.mockResolvedValueOnce(1)

    const req = new NextRequest('http://localhost/api/instructor/classes/class-1/grades?page=1&limit=20', { method: 'GET' })
    const res = await GET(req, { params: Promise.resolve({ id: 'class-1' }) })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data[0].class).toEqual(mockClass)
    expect(json.data[0].enrollments).toHaveLength(1)
    expect(json.meta.total).toBe(1)
  })
})

describe('Instructor Grades — POST /api/instructor/classes/[id]/grades', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireInstructor.mockResolvedValue(mockUser)
    getInstructorProfileByUserId.mockResolvedValue(mockInstructorProfile)
  })

  it('returns 401 when unauthenticated', async () => {
    requireInstructor.mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/api/instructor/classes/class-1/grades', {
      method: 'POST',
      body: JSON.stringify(makeGradeBody()),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'class-1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 403 when instructor profile is missing', async () => {
    getInstructorProfileByUserId.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/instructor/classes/class-1/grades', {
      method: 'POST',
      body: JSON.stringify(makeGradeBody()),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'class-1' }) })
    expect(res.status).toBe(403)
  })

  it('returns 404 when class not found', async () => {
    prismaMock.class.findUnique.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/instructor/classes/class-1/grades', {
      method: 'POST',
      body: JSON.stringify(makeGradeBody()),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'class-1' }) })
    expect(res.status).toBe(404)
  })

  it('returns 403 when not assigned to class', async () => {
    prismaMock.class.findUnique.mockResolvedValueOnce({ ...mockClass, instructorId: 'instructor-other' } as any)
    const req = new NextRequest('http://localhost/api/instructor/classes/class-1/grades', {
      method: 'POST',
      body: JSON.stringify(makeGradeBody()),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'class-1' }) })
    expect(res.status).toBe(403)
  })

  it('returns 400 for invalid body', async () => {
    prismaMock.class.findUnique.mockResolvedValueOnce(mockClass as any)
    const req = new NextRequest('http://localhost/api/instructor/classes/class-1/grades', {
      method: 'POST',
      body: JSON.stringify({ grades: [{ score: -1, maxScore: 100, userId: 'student-1' }] }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'class-1' }) })
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toBeDefined()
  })

  it('submits grades and writes audit log', async () => {
    prismaMock.class.findUnique.mockResolvedValueOnce(mockClass as any)
    prismaMock.enrollment.findFirst.mockResolvedValueOnce(mockEnrollment as any)
    prismaMock.grade.create.mockResolvedValueOnce({
      id: 'grade-1',
      enrollmentId: 'enroll-1',
      userId: 'student-1',
      score: 80,
      maxScore: 100,
      assessmentType: 'ASSIGNMENT',
      category: 'INTERNAL_CA',
      assessmentName: 'HW1',
      percentage: 80,
      gradedBy: 'instructor-1',
      comments: 'Good work',
    } as any)

    const req = new NextRequest('http://localhost/api/instructor/classes/class-1/grades', {
      method: 'POST',
      body: JSON.stringify(makeGradeBody()),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'class-1' }) })
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.grades).toHaveLength(1)
    expect(json.data.grades[0].score).toBe(80)

    expect(prismaMock.grade.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          enrollmentId: 'clxyz12340000000000000000',
          userId: 'clxyz12340000000000000001',
          score: 80,
          maxScore: 100,
          assessmentType: 'ASSIGNMENT',
          category: 'ASSIGNMENT',
          assessmentName: 'HW1',
          percentage: 80,
          gradedBy: 'instructor-1',
          comments: 'Good work',
        }),
      })
    )

    expect(prismaMock.grade.create).toHaveBeenCalledTimes(1)
  })
})
