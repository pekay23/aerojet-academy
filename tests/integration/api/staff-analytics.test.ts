import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStaff: vi.fn(),
  requireAdmin: vi.fn(),
  requireAuth: vi.fn(),
}))

import { GET } from '@/app/api/staff/analytics/dashboard/route'
import { getDashboardAlerts } from '@/lib/analytics/dashboard-alerts'
import { getDashboardMetrics } from '@/lib/analytics/metrics'

describe('Staff Analytics Dashboard — GET /api/staff/analytics/dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    const { getAuthSession } = await import('@/lib/auth/helpers')
    vi.mocked(getAuthSession).mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/staff/analytics/dashboard')
    const res = await GET(req)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Authentication required')
  })

  it('returns 403 when role is STUDENT', async () => {
    const { getAuthSession } = await import('@/lib/auth/helpers')
    vi.mocked(getAuthSession).mockResolvedValue({ user: { role: 'STUDENT' } } as any)

    const req = new NextRequest('http://localhost/api/staff/analytics/dashboard')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns dashboard data with alerts and metrics for staff', async () => {
    const { getAuthSession } = await import('@/lib/auth/helpers')
    vi.mocked(getAuthSession).mockResolvedValue({ user: { role: 'STAFF' } } as any)

    const alerts = [
      { id: 'pending-payments', severity: 'WARNING', title: '3 payments awaiting review', description: '...', count: 3 },
    ]
    const metrics = {
      totalUsers: 120,
      totalStudents: { value: 80, growth: 5 },
      totalApplicants: 20,
      totalInstructors: 10,
      activeEnrollments: { value: 60, growth: 3 },
      pendingPayments: 5,
      openPools: 4,
      totalRevenue: { value: 50000, growth: 8 },
    }

    vi.mocked(getDashboardAlerts).mockResolvedValue(alerts as any)
    vi.mocked(getDashboardMetrics).mockResolvedValue(metrics)

    const req = new NextRequest('http://localhost/api/staff/analytics/dashboard')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.alerts).toHaveLength(1)
    expect(json.data.alerts[0].id).toBe('pending-payments')
    expect(json.data.metrics.totalUsers).toBe(120)
    expect(json.data.metrics.totalRevenue.value).toBe(50000)
  })

  it('returns empty alerts when nothing needs attention', async () => {
    const { getAuthSession } = await import('@/lib/auth/helpers')
    vi.mocked(getAuthSession).mockResolvedValue({ user: { role: 'STAFF' } } as any)

    vi.mocked(getDashboardAlerts).mockResolvedValue([])
    vi.mocked(getDashboardMetrics).mockResolvedValue({
      totalUsers: 100,
      totalStudents: { value: 70, growth: 0 },
      totalApplicants: 15,
      totalInstructors: 8,
      activeEnrollments: { value: 50, growth: 0 },
      pendingPayments: 0,
      openPools: 2,
      totalRevenue: { value: 30000, growth: 0 },
    })

    const req = new NextRequest('http://localhost/api/staff/analytics/dashboard')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.alerts).toEqual([])
    expect(json.data.metrics.pendingPayments).toBe(0)
  })
})
