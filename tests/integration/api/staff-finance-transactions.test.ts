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

import { GET } from '@/app/api/staff/finance/transactions/route'
import { requireStaff } from '@/lib/auth/helpers'
import { serializePrisma } from '@/lib/utils/serialization'

function decimal(n: number) {
  return { toNumber: () => n, valueOf: () => n, toString: () => String(n), d: [1], s: 1 }
}

describe('GET /api/staff/finance/transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireStaff as any).mockResolvedValue({ id: 'staff-1', role: 'ADMIN' })
    prismaMock.walletTransaction.findMany.mockResolvedValue([])
    prismaMock.walletTransaction.count.mockResolvedValue(0)
    prismaMock.payment.findMany.mockResolvedValue([])
    prismaMock.examBooking.findMany.mockResolvedValue([])
    prismaMock.fullTimeEnrollment.findMany.mockResolvedValue([])
    prismaMock.modularEnrollment.findMany.mockResolvedValue([])
    prismaMock.paymentMilestone.findMany.mockResolvedValue([])
  })

  it('returns empty transactions list', async () => {
    const req = new NextRequest('http://localhost/api/staff/finance/transactions?page=1&limit=25')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toEqual([])
    expect(json.meta.total).toBe(0)
    expect(json.related).toBeDefined()
  })

  it('returns transactions with related data', async () => {
    const tx = {
      id: 'tx-1',
      amount: decimal(500),
      type: 'TOP_UP',
      referenceType: 'PAYMENT_ID',
      referenceId: 'pay-1',
      wallet: {
        user: {
          email: 'student@test.com',
          profile: { firstName: 'John', lastName: 'Doe' },
        },
      },
    }
    prismaMock.walletTransaction.findMany.mockResolvedValue([tx])
    prismaMock.walletTransaction.count.mockResolvedValue(1)
    prismaMock.payment.findMany.mockResolvedValue([{ id: 'pay-1', status: 'APPROVED' }])

    const req = new NextRequest('http://localhost/api/staff/finance/transactions?page=1&limit=25')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(1)
    expect(json.related.payments).toHaveLength(1)
  })
})
