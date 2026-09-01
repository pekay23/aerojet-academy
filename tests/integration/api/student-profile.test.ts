import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStudent: vi.fn(),
  requireAuth: vi.fn(),
}))

import { GET, PATCH } from '@/app/api/student/profile/route'
import { requireStudent } from '@/lib/auth/helpers'

const mockUser = {
  id: 'user-1',
  email: 'student@test.com',
  role: 'STUDENT',
  firstName: 'John',
  lastName: 'Doe',
}

const mockProfile = {
  id: 'profile-1',
  userId: 'user-1',
  firstName: 'John',
  lastName: 'Doe',
  middleName: 'M',
  phone: '+1234567890',
  dateOfBirth: '2000-05-15T00:00:00.000Z',
  nationality: 'US',
  address: '456 Aviation Way',
  city: 'Dallas',
  country: 'USA',
  bio: 'Aspiring pilot',
}

const mockStudentProfile = {
  id: 'studentprof-1',
  userId: 'user-1',
  studentId: 'STU-2024-001',
  enrollmentDate: '2024-09-01T00:00:00.000Z',
  program: 'FULL_TIME_4YEAR',
  status: 'ACTIVE',
}

describe('Student Profile — GET /api/student/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireStudent).mockResolvedValue(mockUser as any)
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requireStudent).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/api/student/profile', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns profile and studentProfile on success', async () => {
    prismaMock.profile.findUnique.mockResolvedValueOnce(mockProfile as any)
    prismaMock.studentProfile.findUnique.mockResolvedValueOnce(mockStudentProfile as any)

    const req = new NextRequest('http://localhost/api/student/profile', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.profile).toEqual(mockProfile)
    expect(json.data.studentProfile).toEqual(mockStudentProfile)
    expect(json.data.profile.firstName).toBe('John')
    expect(json.data.profile.lastName).toBe('Doe')
    expect(json.data.profile.email).toBeUndefined()
    expect(json.data.studentProfile.studentId).toBe('STU-2024-001')
  })

  it('returns nulls when profile records do not exist', async () => {
    prismaMock.profile.findUnique.mockResolvedValueOnce(null)
    prismaMock.studentProfile.findUnique.mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost/api/student/profile', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.profile).toBeNull()
    expect(json.data.studentProfile).toBeNull()
  })

  it('queries using the authenticated user id', async () => {
    prismaMock.profile.findUnique.mockResolvedValueOnce(mockProfile as any)
    prismaMock.studentProfile.findUnique.mockResolvedValueOnce(mockStudentProfile as any)

    const req = new NextRequest('http://localhost/api/student/profile', { method: 'GET' })
    await GET(req)

    expect(prismaMock.profile.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } })
    )
    expect(prismaMock.studentProfile.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } })
    )
  })
})

describe('Student Profile — PATCH /api/student/profile', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(requireStudent).mockResolvedValue(mockUser as any)
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requireStudent).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/api/student/profile', {
      method: 'PATCH',
      body: JSON.stringify({ firstName: 'New' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid body (firstName too short)', async () => {
    const req = new NextRequest('http://localhost/api/student/profile', {
      method: 'PATCH',
      body: JSON.stringify({ firstName: 'A' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toBeDefined()
  })

  it('returns 400 for invalid dateOfBirth format', async () => {
    const req = new NextRequest('http://localhost/api/student/profile', {
      method: 'PATCH',
      body: JSON.stringify({ dateOfBirth: 'not-a-date' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toBeDefined()
  })

  it('updates profile and returns updated fields', async () => {
    const updatedProfile = { ...mockProfile, firstName: 'Jane', bio: 'Updated bio' }
    prismaMock.profile.update.mockResolvedValueOnce(updatedProfile as any)

    const req = new NextRequest('http://localhost/api/student/profile', {
      method: 'PATCH',
      body: JSON.stringify({ firstName: 'Jane', bio: 'Updated bio' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.firstName).toBe('Jane')
    expect(json.data.bio).toBe('Updated bio')

    expect(prismaMock.profile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        data: expect.objectContaining({ firstName: 'Jane', bio: 'Updated bio' }),
      })
    )
  })

  it('updates only provided fields', async () => {
    const updatedProfile = { ...mockProfile, phone: '+9876543210' }
    prismaMock.profile.update.mockResolvedValueOnce(updatedProfile as any)

    const req = new NextRequest('http://localhost/api/student/profile', {
      method: 'PATCH',
      body: JSON.stringify({ phone: '+9876543210' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data.phone).toBe('+9876543210')
    expect(prismaMock.profile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        data: expect.objectContaining({ phone: '+9876543210' }),
      })
    )
  })
})
