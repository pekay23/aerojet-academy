import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStudent: vi.fn(),
  requireAuth: vi.fn(),
}))

import { GET, POST } from '@/app/api/student/ojt/route'
import { requireAuth } from '@/lib/auth/helpers'

const mockUser = {
  id: 'user-1',
  email: 'student@test.com',
  role: 'STUDENT',
  firstName: 'John',
  lastName: 'Doe',
}

const mockStudentProfile = {
  id: 'studentprof-1',
  userId: 'user-1',
}

const mockLogbook = {
  id: 'logbook-1',
  studentProfileId: 'studentprof-1',
  entries: [
    {
      id: 'entry-1',
      date: '2024-11-01T00:00:00.000Z',
      durationHours: 4,
      description: 'Pre-flight inspection of Cessna 172',
      maintenanceType: 'INSPECTION',
      supervisorSignature: true,
      studentSignature: true,
      studentSignedAt: '2024-11-01T06:00:00.000Z',
      ataChapterId: 'ata-1',
      ataChapter: { code: '05', title: 'Time Limits', category: 'General' },
    },
    {
      id: 'entry-2',
      date: '2024-10-28T00:00:00.000Z',
      durationHours: 3.5,
      description: 'Engine oil change',
      maintenanceType: 'ROUTINE',
      supervisorSignature: true,
      studentSignature: false,
      studentSignedAt: null,
      ataChapterId: 'ata-2',
      ataChapter: { code: '72', title: 'Engine', category: 'Powerplant' },
    },
  ],
  mentorAssignments: [
    {
      id: 'mentor-1',
      mentorName: 'Capt. Smith',
      isPrimary: true,
    },
  ],
}

describe('Student OJT — GET /api/student/ojt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAuth).mockResolvedValue(mockUser as any)
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/api/student/ojt', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 404 when student profile not found', async () => {
    prismaMock.studentProfile.findUnique.mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost/api/student/ojt', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(404)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toContain('Student profile not found')
  })

  it('returns null when no logbook exists', async () => {
    prismaMock.studentProfile.findUnique.mockResolvedValueOnce(mockStudentProfile as any)
    prismaMock.oJTLogbook.findUnique.mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost/api/student/ojt', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toBeNull()
  })

  it('returns logbook with entries and analytics', async () => {
    prismaMock.studentProfile.findUnique.mockResolvedValueOnce(mockStudentProfile as any)
    prismaMock.oJTLogbook.findUnique.mockResolvedValueOnce(mockLogbook as any)

    const req = new NextRequest('http://localhost/api/student/ojt', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.entries).toHaveLength(2)
    expect(json.data.entries[0]).toHaveProperty('description', 'Pre-flight inspection of Cessna 172')
    expect(json.data.entries[0]).toHaveProperty('durationHours', 4)
    expect(json.data.entries[0]).toHaveProperty('maintenanceType', 'INSPECTION')
    expect(json.data.entries[0]).toHaveProperty('studentSignature', true)
    expect(json.data.entries[0].ataChapter).toHaveProperty('code', '05')
    expect(json.data.entries[0].ataChapter).toHaveProperty('title', 'Time Limits')
    expect(json.data.mentorAssignments).toHaveLength(1)
    expect(json.data.mentorAssignments[0]).toHaveProperty('mentorName', 'Capt. Smith')
  })

  it('computes analytics correctly', async () => {
    prismaMock.studentProfile.findUnique.mockResolvedValueOnce(mockStudentProfile as any)
    prismaMock.oJTLogbook.findUnique.mockResolvedValueOnce(mockLogbook as any)

    const req = new NextRequest('http://localhost/api/student/ojt', { method: 'GET' })
    const res = await GET(req)
    const json = await res.json()

    expect(json.data.analytics).toHaveProperty('totalHours', 7.5)
    expect(json.data.analytics.hoursByType).toHaveProperty('INSPECTION', 4)
    expect(json.data.analytics.hoursByType).toHaveProperty('ROUTINE', 3.5)
    expect(json.data.analytics).toHaveProperty('ataChaptersCovered', 2)
    expect(json.data.analytics).toHaveProperty('signedEntries', 1)
    expect(json.data.analytics).toHaveProperty('unsignedEntries', 1)
  })

  it('queries studentProfile using authenticated user id', async () => {
    prismaMock.studentProfile.findUnique.mockResolvedValueOnce(mockStudentProfile as any)
    prismaMock.oJTLogbook.findUnique.mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost/api/student/ojt', { method: 'GET' })
    await GET(req)

    expect(prismaMock.studentProfile.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } })
    )
  })
})

describe('Student OJT — POST /api/student/ojt (sign entry)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAuth).mockResolvedValue(mockUser as any)
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/api/student/ojt', {
      method: 'POST',
      body: JSON.stringify({ entryId: 'entry-1' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid body (missing entryId)', async () => {
    const req = new NextRequest('http://localhost/api/student/ojt', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toContain('Invalid input')
  })

  it('returns 404 when student profile not found', async () => {
    prismaMock.studentProfile.findUnique.mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost/api/student/ojt', {
      method: 'POST',
      body: JSON.stringify({ entryId: 'entry-1' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('returns 404 when entry does not belong to student logbook', async () => {
    prismaMock.studentProfile.findUnique.mockResolvedValueOnce(mockStudentProfile as any)
    prismaMock.oJTLogbookEntry.findUnique.mockResolvedValueOnce({
      id: 'entry-1',
      logbook: { studentProfileId: 'other-student' },
    } as any)

    const req = new NextRequest('http://localhost/api/student/ojt', {
      method: 'POST',
      body: JSON.stringify({ entryId: 'entry-1' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(404)

    const json = await res.json()
    expect(json.error).toContain('Entry not found')
  })

  it('signs entry and returns updated entry', async () => {
    prismaMock.studentProfile.findUnique.mockResolvedValueOnce(mockStudentProfile as any)
    prismaMock.oJTLogbookEntry.findUnique.mockResolvedValueOnce({
      id: 'entry-1',
      logbook: { studentProfileId: 'studentprof-1' },
    } as any)
    prismaMock.oJTLogbookEntry.update.mockResolvedValueOnce({
      id: 'entry-1',
      studentSignature: true,
      studentSignedAt: '2024-11-02T10:00:00.000Z',
    } as any)

    const req = new NextRequest('http://localhost/api/student/ojt', {
      method: 'POST',
      body: JSON.stringify({ entryId: 'entry-1' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toHaveProperty('studentSignature', true)
    expect(json.data).toHaveProperty('studentSignedAt')

    expect(prismaMock.oJTLogbookEntry.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'entry-1' },
        data: expect.objectContaining({
          studentSignature: true,
          studentSignedAt: expect.any(Date),
        }),
      })
    )
  })
})
