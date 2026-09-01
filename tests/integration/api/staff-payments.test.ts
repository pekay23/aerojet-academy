import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

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

import { GET } from '@/app/api/staff/payments/route'
import { getAuthSession } from '@/lib/auth/helpers'
import { serializePrisma } from '@/lib/utils/serialization'

function decimal(n: number) {
  return { toNumber: () => n, valueOf: () => n, toString: () => String(n), d: [1], s: 1 }
}

const staffSession = { user: { id: 'staff-1', role: 'ADMIN' } }

describe('GET /api/staff/payments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getAuthSession as any).mockResolvedValue(staffSession)
    prismaMock.payment.findMany.mockResolvedValue([])
    prismaMock.payment.count.mockResolvedValue(0)
  })

  it('returns 401 when not authenticated', async () => {
    ;(getAuthSession as any).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/staff/payments')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns paginated payments', async () => {
    const payments = [
      {
        id: 'pay-1',
        status: 'PENDING',
        amount: decimal(500),
        currency: 'EUR',
        referenceType: 'WALLET_TOPUP',
        referenceCode: 'REF-123',
        user: { id: 'u1', email: 'student@test.com', profile: { firstName: 'John', lastName: 'Doe' } },
      },
    ]
    prismaMock.payment.findMany.mockResolvedValue(payments)
    prismaMock.payment.count.mockResolvedValue(1)

    const req = new NextRequest('http://localhost/api/staff/payments?page=1&limit=50')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.total).toBe(1)
    expect(json.payments).toHaveLength(1)
    expect(json.payments[0].amount).toBe(500)
  })

  it('returns empty list when no payments', async () => {
    prismaMock.payment.findMany.mockResolvedValue([])
    prismaMock.payment.count.mockResolvedValue(0)

    const req = new NextRequest('http://localhost/api/staff/payments')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.payments).toHaveLength(0)
    expect(json.total).toBe(0)
  })
})
