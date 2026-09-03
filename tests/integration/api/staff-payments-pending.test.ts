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

import { GET } from '@/app/api/staff/payments/pending/route'
import { requireStaff } from '@/lib/auth/helpers'
import { serializePrisma } from '@/lib/utils/serialization'

function decimal(n: number) {
  return { toNumber: () => n, valueOf: () => n, toString: () => String(n), d: [1], s: 1 }
}

describe('GET /api/staff/payments/pending', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    prismaMock.payment.findMany.mockResolvedValue([])
    prismaMock.payment.count.mockResolvedValue(0)
  })

  it('returns paginated pending payments', async () => {
    const payments = [
      {
        id: 'pay-1',
        status: 'PENDING',
        amount: decimal(300),
        currency: 'EUR',
        referenceType: 'REGISTRATION',
        user: { profile: { firstName: 'Jane', lastName: 'Doe' } },
      },
    ]
    prismaMock.payment.findMany.mockResolvedValue(payments)
    prismaMock.payment.count.mockResolvedValue(1)

    const req = new NextRequest('http://localhost/api/staff/payments/pending?page=1&limit=20')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].status).toBe('PENDING')
    expect(json.meta.total).toBe(1)
  })

  it('returns empty list when no pending payments', async () => {
    prismaMock.payment.findMany.mockResolvedValue([])
    prismaMock.payment.count.mockResolvedValue(0)

    const req = new NextRequest('http://localhost/api/staff/payments/pending')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(0)
  })
})
