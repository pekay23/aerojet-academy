import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStaff: vi.fn(),
  requireStudent: vi.fn(),
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
  requireInstructor: vi.fn(),
  requireApplicant: vi.fn(),
  hashPassword: vi.fn(),
  generateToken: vi.fn(),
  generateTempPassword: vi.fn(),
  generateAcademyEmail: vi.fn(),
}))

vi.mock('@/lib/finance/overview', () => ({
  getFinanceOverviewData: vi.fn(),
}))

import { GET } from '@/app/api/staff/finance/overview/route'
import { getAuthSession } from '@/lib/auth/helpers'
import { getFinanceOverviewData } from '@/lib/finance/overview'

const staffSession = { user: { id: 'staff-1', role: 'ADMIN' } }

describe('GET /api/staff/finance/overview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getAuthSession as any).mockResolvedValue(staffSession)
    ;(getFinanceOverviewData as any).mockResolvedValue({
      totalRevenue: 10000,
      totalRevenueCount: 50,
      totalRegistration: 5000,
      totalCourse: 3000,
      monthRegistration: 1000,
      monthCourse: 500,
      lastMonthRegistration: 800,
      lastMonthCourse: 400,
      pendingCount: 5,
      pendingTotal: 2000,
      recentTransactions: [],
    })
  })

  it('returns 401 when not authenticated', async () => {
    ;(getAuthSession as any).mockResolvedValue(null)
    const req = new Request('http://localhost/api/staff/finance/overview')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns finance overview data', async () => {
    const req = new Request('http://localhost/api/staff/finance/overview')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.totalRevenue).toBe(10000)
    expect(json.pendingCount).toBe(5)
    expect(json.recentTransactions).toEqual([])
  })
})
