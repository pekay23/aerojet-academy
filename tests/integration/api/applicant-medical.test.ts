vi.mock('@/lib/api/response', () => ({
  apiSuccess: vi.fn((data) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiCreated: vi.fn((data) => ({ status: 201, json: () => Promise.resolve(data) })),
  apiPaginated: vi.fn((data) => ({ status: 200, json: () => Promise.resolve(data) })),
  parsePagination: vi.fn(() => ({ page: 1, limit: 20, skip: 0 })),
  apiUnauthorized: vi.fn().mockReturnValue({ status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) }),
  apiForbidden: vi.fn().mockReturnValue({ status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) }),
  apiError: vi.fn((message, status = 400) => ({ status: status || 400, json: () => Promise.resolve({ message, error: message }) })),
  apiNotFound: vi.fn((message) => ({ status: 404, json: () => Promise.resolve({ message, error: message }) })),
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

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn().mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com', role: 'APPLICANT' } }),
  requireStaff: vi.fn(),
  requireStudent: vi.fn(),
  requireApplicant: vi.fn().mockResolvedValue({ id: 'user-1', role: 'APPLICANT' }),
  requireInstructor: vi.fn(),
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
  requirePermission: vi.fn(),
  hashPassword: vi.fn().mockResolvedValue('$hashed$'),
  verifyPassword: vi.fn().mockResolvedValue(true),
  generateToken: vi.fn().mockReturnValue('verify-token'),
  generateTempPassword: vi.fn().mockReturnValue('TempPass1!'),
  generateAcademyEmail: vi.fn().mockResolvedValue('j.doe@aerojet-academy.com'),
  generateStudentId: vi.fn().mockReturnValue('STU-001'),
}))

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  logAuditEvent: vi.fn(),
  AuditAction: { CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE', PAYMENT_APPROVE: 'PAYMENT_APPROVE', ENROLLMENT_APPROVE: 'ENROLLMENT_APPROVE' },
}))

vi.mock('@/lib/email/service', () => ({
  sendPaymentApprovedEmail: vi.fn(),
  sendPaymentRejectedEmail: vi.fn(),
  sendStudentPromotionEmail: vi.fn(),
  sendActivationEmail: vi.fn(),
}))

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/applicant/medical/route.ts'
import { requireApplicant } from '@/lib/auth/helpers'

describe('/applicant/medical', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireApplicant as any).mockResolvedValue({ id: 'user-1', role: 'APPLICANT' })
    prismaMock.notification.create.mockResolvedValue({} as any)
    prismaMock.application.findUnique.mockResolvedValue({ id: 'app-1', userId: 'user-1', stage: 'MEDICAL_PENDING', medicalStatus: 'PENDING', documents: [] } as any)
    prismaMock.applicationDocumentType.findMany.mockResolvedValue([{ id: 'dt-1', name: 'Medical Form', slug: 'medical-form' }] as any)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireApplicant as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/applicant/medical')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when stage is not medical', async () => {
    prismaMock.application.findUnique.mockResolvedValueOnce({ id: 'app-1', userId: 'user-1', stage: 'INTERVIEW_PENDING', documents: [] } as any)
    const req = new NextRequest('http://localhost/applicant/medical')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('returns 200 with data when resource exists', async () => {
    const req = new NextRequest('http://localhost/applicant/medical')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
  })

  it('returns 404 when application not found', async () => {
    prismaMock.application.findUnique.mockResolvedValueOnce(null as any)
    const req = new NextRequest('http://localhost/applicant/medical')
    const res = await GET(req)
    expect(res.status).toBe(404)
  })
})
