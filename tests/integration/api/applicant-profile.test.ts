import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireApplicant: vi.fn(),
  verifyPassword: vi.fn().mockResolvedValue(true),
  hashPassword: vi.fn().mockResolvedValue('$hashed$'),
  generateToken: vi.fn().mockReturnValue('verify-token'),
  generateTempPassword: vi.fn().mockReturnValue('TempPass1!'),
  generateAcademyEmail: vi.fn().mockResolvedValue('j.doe@aerojet-academy.com'),
}))

import { GET, PATCH } from '@/app/api/applicant/profile/route'
import { requireApplicant } from '@/lib/auth/helpers'

const mockUser = { id: 'user-1', role: 'APPLICANT' }
const mockProfile = {
  id: 'profile-1',
  userId: 'user-1',
  firstName: 'Applicant',
  lastName: 'Test',
  middleName: 'M',
  phone: '+1234567890',
  dateOfBirth: '1995-05-05T00:00:00.000Z',
  nationality: 'US',
  address: '456 Oak Ave',
  city: 'LA',
  country: 'USA',
  bio: 'Aviation enthusiast',
}

describe('Applicant Profile — GET /api/applicant/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireApplicant as any).mockResolvedValue(mockUser)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireApplicant as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/api/applicant/profile', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns profile on success', async () => {
    prismaMock.profile.findUnique.mockResolvedValueOnce(mockProfile as any)

    const req = new NextRequest('http://localhost/api/applicant/profile', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toEqual(mockProfile)
  })

  it('returns null when profile does not exist', async () => {
    prismaMock.profile.findUnique.mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost/api/applicant/profile', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data).toBeNull()
  })
})

describe('Applicant Profile — PATCH /api/applicant/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireApplicant as any).mockResolvedValue(mockUser)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireApplicant as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/api/applicant/profile', {
      method: 'PATCH',
      body: JSON.stringify({ firstName: 'New' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid body', async () => {
    const req = new NextRequest('http://localhost/api/applicant/profile', {
      method: 'PATCH',
      body: JSON.stringify({ firstName: '' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toBeDefined()
  })

  it('creates profile when none exists (upsert create)', async () => {
    const createdProfile = { ...mockProfile, firstName: 'NewName' }
    prismaMock.profile.upsert.mockResolvedValueOnce(createdProfile as any)

    const req = new NextRequest('http://localhost/api/applicant/profile', {
      method: 'PATCH',
      body: JSON.stringify({ firstName: 'NewName', lastName: 'Test' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.firstName).toBe('NewName')

    expect(prismaMock.profile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        update: expect.objectContaining({ firstName: 'NewName' }),
        create: expect.objectContaining({
          userId: 'user-1',
          firstName: 'NewName',
          lastName: 'Test',
        }),
      })
    )
  })

  it('updates existing profile (upsert update)', async () => {
    const updatedProfile = { ...mockProfile, phone: '+9999999999' }
    prismaMock.profile.upsert.mockResolvedValueOnce(updatedProfile as any)

    const req = new NextRequest('http://localhost/api/applicant/profile', {
      method: 'PATCH',
      body: JSON.stringify({ phone: '+9999999999' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data.phone).toBe('+9999999999')

    expect(prismaMock.profile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        update: expect.objectContaining({ phone: '+9999999999' }),
      })
    )
  })
})
