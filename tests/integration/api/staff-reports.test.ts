import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStaff: vi.fn(),
  requireAdmin: vi.fn(),
  requireAuth: vi.fn(),
}))

vi.mock('@/lib/audit/logger', () => ({
  logAuditEvent: vi.fn(),
  AuditAction: { REPORT_DOWNLOAD: 'REPORT_DOWNLOAD' },
}))

import { GET } from '@/app/api/staff/reports/roster/[poolId]/route'
import { GET as GETPools } from '@/app/api/staff/reports/pools/route'

describe('Staff Reports — roster + pools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/staff/reports/roster/[poolId]', () => {
    it('returns 401 when unauthenticated', async () => {
      const { getAuthSession } = await import('@/lib/auth/helpers')
      vi.mocked(getAuthSession).mockResolvedValue(null)

      const req = new NextRequest('http://localhost/api/staff/reports/roster/pool-1')
      const res = await GET(req, { params: Promise.resolve({ poolId: 'pool-1' }) })
      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toBe('Authentication required')
    })

    it('returns 400 when poolId is missing', async () => {
      const { getAuthSession } = await import('@/lib/auth/helpers')
      vi.mocked(getAuthSession).mockResolvedValue({ user: { role: 'STAFF' } } as any)

      const req = new NextRequest('http://localhost/api/staff/reports/roster/')
      const res = await GET(req as any, { params: Promise.resolve({ poolId: '' }) })
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Missing poolId')
    })

    it('returns 500 when generatePoolRosterCSV throws', async () => {
      const { getAuthSession } = await import('@/lib/auth/helpers')
      vi.mocked(getAuthSession).mockResolvedValue({ user: { role: 'STAFF' } } as any)
      prismaMock.examPool.findUnique.mockResolvedValueOnce({ id: 'pool-1', name: 'Test Pool' } as any)

      const { generatePoolRosterCSV } = await import('@/lib/compliance/reports')
      vi.mocked(generatePoolRosterCSV).mockRejectedValueOnce(new Error('CSV generation failed'))

      const req = new NextRequest('http://localhost/api/staff/reports/roster/pool-1')
      const res = await GET(req, { params: Promise.resolve({ poolId: 'pool-1' }) })
      expect(res.status).toBe(500)
      const json = await res.json()
      expect(json.error).toBe('CSV generation failed')
    })

    it('returns CSV with correct headers and content on success', async () => {
      const { getAuthSession } = await import('@/lib/auth/helpers')
      vi.mocked(getAuthSession).mockResolvedValue({ user: { id: 'staff-1', role: 'STAFF' } } as any)

      const csvContent = '"Pool Name","Test Pool"\n"Candidate Name","Registration Number","Module Code","Module Name","Status"\n"John Doe","REG-001","M01","Module 1","CONFIRMED"'
      const { generatePoolRosterCSV } = await import('@/lib/compliance/reports')
      vi.mocked(generatePoolRosterCSV).mockResolvedValue(csvContent)

      const req = new NextRequest('http://localhost/api/staff/reports/roster/pool-1')
      const res = await GET(req, { params: Promise.resolve({ poolId: 'pool-1' }) })
      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toBe('text/csv')
      expect(res.headers.get('Content-Disposition')).toContain('roster-pool-1')
      const text = await res.text()
      expect(text).toContain('John Doe')
      expect(text).toContain('REG-001')
    })
  })

  describe('GET /api/staff/reports/pools', () => {
    it('returns 401 when unauthenticated', async () => {
      const { requireStaff } = await import('@/lib/auth/helpers')
      vi.mocked(requireStaff).mockRejectedValueOnce(new Error('Unauthorized'))

      const req = new NextRequest('http://localhost/api/staff/reports/pools')
      const res = await GETPools(req)
      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toBe('Authentication required')
    })

    it('returns 403 when role is STUDENT', async () => {
      const { requireStaff } = await import('@/lib/auth/helpers')
      vi.mocked(requireStaff).mockRejectedValueOnce(new Error('Forbidden'))

      const req = new NextRequest('http://localhost/api/staff/reports/pools')
      const res = await GETPools(req)
      expect(res.status).toBe(403)
    })

    it('returns pool report data for staff', async () => {
      const { requireStaff } = await import('@/lib/auth/helpers')
      vi.mocked(requireStaff).mockResolvedValue({ id: 'staff-1', role: 'STAFF' } as any)

      prismaMock.examPool.count.mockResolvedValueOnce(10)
      prismaMock.examPool.groupBy.mockResolvedValueOnce([
        { status: 'OPEN', _count: { status: 5 } },
        { status: 'CONFIRMED', _count: { status: 3 } },
      ])
      prismaMock.examPool.aggregate.mockResolvedValueOnce({ _avg: { currentMemberCount: 12 } })
      prismaMock.poolMembership.aggregate.mockResolvedValueOnce({
        _sum: { amountPaid: 5000 },
        _count: { amountPaid: 20 },
      })

      const req = new NextRequest('http://localhost/api/staff/reports/pools')
      const res = await GETPools(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.data.totalPools).toBe(10)
      expect(json.data.byStatus).toHaveLength(2)
      expect(json.data.averageMembers).toBe(12)
      expect(json.data.confirmedRevenue).toBe(5000)
    })
  })
})
