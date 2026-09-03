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

vi.mock('@/lib/analytics/reports', () => ({
  getFinanceReportSummary: vi.fn().mockReturnValue({ success: true }),
  getRevenueByProgrammeType: vi.fn().mockReturnValue({ success: true }),
  getPaymentMethodBreakdown: vi.fn().mockReturnValue({ success: true }),
  getMonthlyRevenueData: vi.fn().mockReturnValue({ success: true }),
  getPaymentStatusBreakdown: vi.fn().mockReturnValue({ success: true }),
}))

import { GET } from '@/app/api/staff/finance/reports/route'
import { requireStaff } from '@/lib/auth/helpers'

describe('GET /api/staff/finance/reports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
  })

  it('returns 200 with report data', async () => {
    const req = new NextRequest('http://localhost/api/staff/finance/reports', {
      headers: { Authorization: 'Bearer test-secret' },
    })
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
  })

  it('returns 200 with year/month filters', async () => {
    const req = new NextRequest('http://localhost/api/staff/finance/reports?year=2024&month=6', {
      headers: { Authorization: 'Bearer test-secret' },
    })
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toBeDefined()
  })

  it('returns 500 when an error occurs', async () => {
    ;(requireStaff as any).mockRejectedValueOnce(new Error('Database error'))
    const req = new NextRequest('http://localhost/api/staff/finance/reports', {
      headers: { Authorization: 'Bearer test-secret' },
    })
    const res = await GET(req)
    expect(res.status).toBe(500)
  })
})
