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

vi.mock('@/lib/wallet/operations', () => ({
  getTransactions: vi.fn(),
}))

import { GET } from '@/app/api/student/wallet/transactions/route'
import { requireStudent } from '@/lib/auth/helpers'
import { getTransactions } from '@/lib/wallet/operations'

function decimal(n: number) {
  return { toNumber: () => n, valueOf: () => n, toString: () => String(n) }
}

describe('GET /api/student/wallet/transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireStudent as any).mockResolvedValue({ id: 'student-1', role: 'STUDENT' })
    ;(getTransactions as any).mockResolvedValue({ transactions: [], total: 0 })
  })

  it('returns paginated transactions', async () => {
    const transactions = [
      { id: 'tx-1', type: 'TOP_UP', amount: decimal(200), walletId: 'w1' },
    ]
    ;(getTransactions as any).mockResolvedValue({ transactions, total: 1 })

    const req = new NextRequest('http://localhost/api/student/wallet/transactions?page=1&limit=20')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(1)
    expect(json.meta.total).toBe(1)
  })

  it('returns empty list when no transactions', async () => {
    ;(getTransactions as any).mockResolvedValue({ transactions: [], total: 0 })

    const req = new NextRequest('http://localhost/api/student/wallet/transactions')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(0)
    expect(json.meta.total).toBe(0)
  })
})
