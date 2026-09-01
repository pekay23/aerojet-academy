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
 vi.mock('@/lib/api/response', () => ({
   apiSuccess: vi.fn((data) => ({ status: 200, json: () => Promise.resolve(data) })),
   apiCreated: vi.fn((data) => ({ status: 201, json: () => Promise.resolve(data) })),
   apiPaginated: vi.fn((data, total, page, limit) => ({
     status: 200,
     json: () => Promise.resolve(data),
   })),
   parsePagination: vi.fn().mockReturnValue({ page: 1, limit: 20, skip: 0 }),
   parseSorting: vi.fn().mockReturnValue({ sortBy: 'createdAt', sortOrder: 'desc' }),
   parseSearch: vi.fn().mockReturnValue(undefined),
   apiError: vi.fn((message, status) => ({ status: status || 400, json: () => Promise.resolve({ message, error: message }) })),
   apiUnauthorized: vi.fn(() => ({ status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) })),
   apiForbidden: vi.fn(() => ({ status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) })),
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
 vi.mock('@/lib/pools/pricing-config', () => ({
   getExamPricingConfig: vi.fn().mockResolvedValue({
     poolExamFee: 300,
     individualExamFee: 520,
     multiPoolDiscountFee: 270,
     twoSeatBundle: 980,
     fourSeatBundle: 1900,
     resitExamFee: 480,
     groupCharterFee: 7500,
     lateBookingSurcharge: 50,
     moduleChangeFee: 50,
     lateBookingDays: 14,
     ambassadorCredit: 100,
   }),
 }))
 vi.mock('@/lib/pools/pricing', () => ({
   getBundlePricing: vi.fn().mockResolvedValue({
     twoSeat: { price: 980, seats: 2, perSeat: 490, savings: 820 },
     fourSeat: { price: 1900, seats: 4, perSeat: 475, savings: 280 },
     groupCharter: { price: 7500, maxSeats: 28, perSeat: 268 },
   }),
 }))

  import { describe, it, expect, vi, beforeEach } from 'vitest'
  import { prismaMock } from '@/tests/setup'
  import { NextRequest } from 'next/server'
  import { GET } from '@/app/api/applicant/exam-only/pricing/route.ts'
  import { requireApplicant } from '@/lib/auth/helpers'


describe('/applicant/exam-only/pricing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireApplicant as any).mockResolvedValue({ id: 'user-1', role: 'APPLICANT' })
    prismaMock.notification.create.mockResolvedValue({} as any)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireApplicant as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/applicant/exam-only/pricing')
    const res = await GET(req)
    expect([401, 403]).toContain(res.status)
  })

  it('returns 200 with data', async () => {
    const req = new NextRequest('http://localhost/applicant/exam-only/pricing?page=1&limit=20')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
    expect(json).toHaveProperty('pool')
    expect(json).toHaveProperty('individual')
    expect(json).toHaveProperty('resit')
    expect(json).toHaveProperty('bundles')
    expect(json).toHaveProperty('surcharges')
    expect(json).toHaveProperty('groupCharter')
  })
})
