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
  apiSuccess: vi.fn((data: any) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiError: vi.fn((message: any, status?: number) => ({
    status: status || 400,
    json: () => Promise.resolve({ message, error: message }),
  })),
  apiNotFound: vi.fn((message) => ({
    status: 404,
    json: () => Promise.resolve({ message, error: message }),
  })),
  withErrorHandler: vi.fn((fn: any) => {
    return async (req: any, ctx?: any) => {
      try {
        const resolvedCtx = ctx?.params ? { ...ctx, params: await ctx.params } : ctx
        return await fn(req, resolvedCtx)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (message === 'Unauthorized')
          return { status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) }
        if (message === 'Forbidden')
          return { status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) }
        return { status: 500, json: () => Promise.resolve({ error: 'Internal Server Error' }) }
      }
    }
  }),
}))

import { GET } from '@/app/api/staff/admissions/document-types/[id]/route'
import { PUT } from '@/app/api/staff/admissions/document-types/[id]/route'
import { DELETE } from '@/app/api/staff/admissions/document-types/[id]/route'
import { requireStaff } from '@/lib/auth/helpers'

describe('GET/PUT/DELETE /api/staff/admissions/document-types/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
  })

  describe('GET', () => {
    it('returns document type when found', async () => {
      prismaMock.applicationDocumentType.findUnique.mockResolvedValueOnce({
        id: 'doc-type-1',
        name: 'Passport',
        slug: 'passport',
        _count: { documents: 0 },
      } as any)
      const req = new NextRequest(
        'http://localhost/api/staff/admissions/document-types/doc-type-1',
        {
          headers: { Authorization: 'Bearer test-secret' },
        }
      )
      const res = await GET(req, { params: Promise.resolve({ id: 'doc-type-1' }) })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })

    it('returns 404 when document type not found', async () => {
      prismaMock.applicationDocumentType.findUnique.mockResolvedValueOnce(null)
      const req = new NextRequest(
        'http://localhost/api/staff/admissions/document-types/nonexistent',
        {
          headers: { Authorization: 'Bearer test-secret' },
        }
      )
      const res = await GET(req, { params: Promise.resolve({ id: 'nonexistent' }) })
      expect(res.status).toBe(404)
    })

    it('returns 401 when unauthenticated', async () => {
      ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const req = new NextRequest(
        'http://localhost/api/staff/admissions/document-types/doc-type-1',
        {
          headers: { Authorization: 'Bearer test-secret' },
        }
      )
      const res = await GET(req, { params: Promise.resolve({ id: 'doc-type-1' }) })
      expect(res.status).toBe(401)
    })
  })

  describe('PUT', () => {
    it('updates document type with valid data', async () => {
      prismaMock.applicationDocumentType.findUnique.mockResolvedValueOnce({
        id: 'doc-type-1',
        name: 'Passport',
        slug: 'passport',
      } as any)
      prismaMock.applicationDocumentType.update.mockResolvedValueOnce({
        id: 'doc-type-1',
        name: 'Updated Passport',
        slug: 'passport',
      } as any)
      const req = new NextRequest(
        'http://localhost/api/staff/admissions/document-types/doc-type-1',
        {
          method: 'PUT',
          headers: { Authorization: 'Bearer test-secret' },
          body: JSON.stringify({ name: 'Updated Passport' }),
        }
      )
      const res = await PUT(req, { params: Promise.resolve({ id: 'doc-type-1' }) })
      expect(res.status).toBe(200)
    })

    it('returns 404 when document type not found', async () => {
      prismaMock.applicationDocumentType.findUnique.mockResolvedValueOnce(null)
      const req = new NextRequest(
        'http://localhost/api/staff/admissions/document-types/nonexistent',
        {
          method: 'PUT',
          headers: { Authorization: 'Bearer test-secret' },
          body: JSON.stringify({ name: 'Updated' }),
        }
      )
      const res = await PUT(req, { params: Promise.resolve({ id: 'nonexistent' }) })
      expect(res.status).toBe(404)
    })

    it('returns 400 for invalid input', async () => {
      const req = new NextRequest(
        'http://localhost/api/staff/admissions/document-types/doc-type-1',
        {
          method: 'PUT',
          headers: { Authorization: 'Bearer test-secret' },
          body: JSON.stringify({ name: '' }),
        }
      )
      const res = await PUT(req, { params: Promise.resolve({ id: 'doc-type-1' }) })
      expect(res.status).toBe(400)
    })

    it('returns 401 when unauthenticated', async () => {
      ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const req = new NextRequest(
        'http://localhost/api/staff/admissions/document-types/doc-type-1',
        {
          method: 'PUT',
          headers: { Authorization: 'Bearer test-secret' },
          body: JSON.stringify({ name: 'Updated' }),
        }
      )
      const res = await PUT(req, { params: Promise.resolve({ id: 'doc-type-1' }) })
      expect(res.status).toBe(401)
    })
  })

  describe('DELETE', () => {
    it('deletes document type with no existing documents', async () => {
      prismaMock.applicationDocumentType.findUnique.mockResolvedValueOnce({
        id: 'doc-type-1',
        name: 'Passport',
        _count: { documents: 0 },
      } as any)
      prismaMock.applicationDocumentType.delete.mockResolvedValueOnce({} as any)
      const req = new NextRequest(
        'http://localhost/api/staff/admissions/document-types/doc-type-1',
        {
          method: 'DELETE',
          headers: { Authorization: 'Bearer test-secret' },
        }
      )
      const res = await DELETE(req, { params: Promise.resolve({ id: 'doc-type-1' }) })
      expect(res.status).toBe(200)
    })

    it('returns 400 when document type has existing documents', async () => {
      prismaMock.applicationDocumentType.findUnique.mockResolvedValueOnce({
        id: 'doc-type-1',
        name: 'Passport',
        _count: { documents: 3 },
      } as any)
      const req = new NextRequest(
        'http://localhost/api/staff/admissions/document-types/doc-type-1',
        {
          method: 'DELETE',
          headers: { Authorization: 'Bearer test-secret' },
        }
      )
      const res = await DELETE(req, { params: Promise.resolve({ id: 'doc-type-1' }) })
      expect(res.status).toBe(400)
    })

    it('returns 404 when document type not found', async () => {
      prismaMock.applicationDocumentType.findUnique.mockResolvedValueOnce(null)
      const req = new NextRequest(
        'http://localhost/api/staff/admissions/document-types/nonexistent',
        {
          method: 'DELETE',
          headers: { Authorization: 'Bearer test-secret' },
        }
      )
      const res = await DELETE(req, { params: Promise.resolve({ id: 'nonexistent' }) })
      expect(res.status).toBe(404)
    })

    it('returns 401 when unauthenticated', async () => {
      ;(requireStaff as any).mockRejectedValueOnce(new Error('Unauthorized'))
      const req = new NextRequest(
        'http://localhost/api/staff/admissions/document-types/doc-type-1',
        {
          method: 'DELETE',
          headers: { Authorization: 'Bearer test-secret' },
        }
      )
      const res = await DELETE(req, { params: Promise.resolve({ id: 'doc-type-1' }) })
      expect(res.status).toBe(401)
    })
  })
})
