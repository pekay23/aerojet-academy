import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStaff: vi.fn(),
  requireAdmin: vi.fn(),
  requireAuth: vi.fn(),
  hashPassword: vi.fn(),
  generateToken: vi.fn(),
  generateTempPassword: vi.fn(),
  generateAcademyEmail: vi.fn(),
  getClientIp: vi.fn(),
  verifyPassword: vi.fn(),
  generateStudentId: vi.fn(),
  checkRateLimit: vi.fn(),
  requireStudent: vi.fn(),
  requireInstructor: vi.fn(),
  requireApplicant: vi.fn(),
  requireAdminOrStaff: vi.fn(),
  requireExaminer: vi.fn(),
  generateRegistrationCode: vi.fn(),
}))

vi.mock('@/lib/api/response', () => ({
  apiSuccess: vi.fn((data) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiError: vi.fn((message, status) => ({ status: status || 400, json: () => Promise.resolve({ message, error: message }) })),
  apiCreated: vi.fn((data) => ({ status: 201, json: () => Promise.resolve(data) })),
  withErrorHandler: vi.fn((fn) => {
    return async (req, ctx) => {
      try {
        const resolvedCtx = ctx?.params ? { ...ctx, params: await ctx.params } : ctx
        return await fn(req, resolvedCtx)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (message === 'Unauthorized') return { status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) }
        if (message === 'Forbidden') return { status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) }
        return { status: 500, json: () => Promise.resolve({ error: 'Internal Server Error' }) }
      }
    }
  }),
}))

import { GET } from '@/app/api/staff/ojt/[logbookId]/route.ts'
import { POST } from '@/app/api/staff/ojt/[logbookId]/route.ts'
import { getAuthSession, requireStaff, requireAdmin, requireAuth } from '@/lib/auth/helpers'

describe('GET/POST /api/staff/ojt/[logbookId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn) => fn(prismaMock))
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(requireAdmin as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(requireAuth as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'staff-1', role: 'ADMIN' } })
  })

  describe('GET', () => {
    it('returns logbook detail', async () => {
      prismaMock.oJTLogbook.findUnique.mockResolvedValueOnce({
        id: 'logbook-1',
        startDate: new Date('2024-01-01'),
        entries: [],
        mentorAssignments: [],
        studentProfile: {
          studentId: 'student-1',
          user: { profile: { firstName: 'John', lastName: 'Doe' } },
        },
      } as any)
      const req = new NextRequest('http://localhost/api/staff/ojt/logbook-1', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req, { params: Promise.resolve({ logbookId: 'logbook-1' }) })
      expect(res.status).toBe(200)
    })

    it('returns 404 when logbook not found', async () => {
      prismaMock.oJTLogbook.findUnique.mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/staff/ojt/logbook-1', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req, { params: Promise.resolve({ logbookId: 'logbook-1' }) })
      expect(res.status).toBe(404)
    })
  })

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const req = new NextRequest('http://localhost/api/staff/ojt/logbook-1', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({}),
      })
      const res = await POST(req, { params: Promise.resolve({ logbookId: 'logbook-1' }) })
      expect(res.status).toBe(401)
    })

    it('returns 400 for invalid input', async () => {
      const req = new NextRequest('http://localhost/api/staff/ojt/logbook-1', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({ invalid: 'data' }),
      })
      const res = await POST(req, { params: Promise.resolve({ logbookId: 'logbook-1' }) })
      expect(res.status).toBe(400)
    })

    it('creates logbook entry on valid input', async () => {
      prismaMock.oJTLogbook.findUnique.mockResolvedValueOnce({ id: 'logbook-1', status: 'ACTIVE' } as any)
      prismaMock.oJTLogbookEntry.create.mockResolvedValueOnce({ id: 'entry-1' } as any)
      prismaMock.oJTLogbook.update.mockResolvedValueOnce({ id: 'logbook-1' } as any)
      const req = new NextRequest('http://localhost/api/staff/ojt/logbook-1', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-secret' },
        body: JSON.stringify({
          date: '2024-06-01',
          aircraftType: 'B737',
          aircraftRegistration: 'N12345',
          ataChapterId: 'ATA-24',
          taskDescription: 'Replace generator',
          maintenanceType: 'LINE',
          durationHours: 2,
          supervisorId: 'supervisor-1',
        }),
      })
      const res = await POST(req, { params: Promise.resolve({ logbookId: 'logbook-1' }) })
      expect(res.status).toBe(201)
    })
  })
})
