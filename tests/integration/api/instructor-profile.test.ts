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

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  AuditAction: {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
  },
}))

import { GET, PATCH } from '@/app/api/instructor/profile/route'
import { requireInstructor } from '@/lib/auth/helpers'
import { createAuditLog } from '@/lib/audit/logger'

const mockUser = {
  id: 'user-1',
  email: 'instructor@test.com',
  role: 'INSTRUCTOR',
  firstName: 'Jane',
  lastName: 'Doe',
}

const mockProfile = {
  id: 'profile-1',
  userId: 'user-1',
  firstName: 'Jane',
  lastName: 'Doe',
  middleName: 'M',
  phone: '+1234567890',
  dateOfBirth: '1990-01-01T00:00:00.000Z',
  nationality: 'US',
  address: '123 Main St',
  city: 'NYC',
  country: 'USA',
  bio: 'Experienced instructor',
}

const mockInstructorProfile = {
  id: 'instructor-1',
  userId: 'user-1',
  employeeId: 'EMP-001',
  hireDate: '2020-01-01T00:00:00.000Z',
  qualifications: 'CFI, CFII',
  status: 'ACTIVE',
}

describe('Instructor Profile — GET /api/instructor/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireInstructor as any).mockResolvedValue(mockUser)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireInstructor as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/api/instructor/profile', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns profile and instructorProfile on success', async () => {
    prismaMock.profile.findUnique.mockResolvedValueOnce(mockProfile as any)
    prismaMock.instructorProfile.findUnique.mockResolvedValueOnce(mockInstructorProfile as any)

    const req = new NextRequest('http://localhost/api/instructor/profile', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.profile).toEqual(mockProfile)
    expect(json.data.instructorProfile).toEqual(mockInstructorProfile)
  })

  it('returns nulls when profile records do not exist', async () => {
    prismaMock.profile.findUnique.mockResolvedValueOnce(null)
    prismaMock.instructorProfile.findUnique.mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost/api/instructor/profile', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data.profile).toBeNull()
    expect(json.data.instructorProfile).toBeNull()
  })
})

describe('Instructor Profile — PATCH /api/instructor/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireInstructor as any).mockResolvedValue(mockUser)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireInstructor as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/api/instructor/profile', {
      method: 'PATCH',
      body: JSON.stringify({ firstName: 'New' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid body', async () => {
    const req = new NextRequest('http://localhost/api/instructor/profile', {
      method: 'PATCH',
      body: JSON.stringify({ firstName: '' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toBeDefined()
  })

  it('updates profile and returns updated fields', async () => {
    const updatedProfile = { ...mockProfile, firstName: 'NewName' }
    prismaMock.profile.update.mockResolvedValueOnce(updatedProfile as any)

    const req = new NextRequest('http://localhost/api/instructor/profile', {
      method: 'PATCH',
      body: JSON.stringify({ firstName: 'NewName' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.firstName).toBe('NewName')

    expect(prismaMock.profile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        data: expect.objectContaining({ firstName: 'NewName' }),
      })
    )
  })
})
