vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi
    .fn()
    .mockResolvedValue({ user: { id: 'user-1', email: 'test@test.com', role: 'APPLICANT' } }),
  requireStaff: vi.fn(),
  requireStudent: vi.fn(),
  requireApplicant: vi
    .fn()
    .mockResolvedValue({ id: 'user-1', email: 'test@test.com', role: 'APPLICANT' }),
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

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/applicant/exam-only/wallet/transactions/route'
import { requireApplicant } from '@/lib/auth/helpers'

describe('/applicant/exam-only/wallet/transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireApplicant as any).mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      role: 'APPLICANT',
    })
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireApplicant as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/applicant/exam-only/wallet/transactions')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 200 with transactions and payments', async () => {
    prismaMock.walletTransaction.findMany.mockResolvedValue([
      {
        id: 'wt-1',
        amount: 100,
        type: 'TOP_UP',
        createdAt: new Date('2024-01-01'),
        referenceType: null,
        referenceId: null,
        description: null,
      },
    ] as any)
    prismaMock.payment.findMany.mockResolvedValue([
      {
        id: 'p-1',
        amount: 100,
        status: 'COMPLETED',
        paymentMethod: null,
        createdAt: new Date('2024-01-01'),
        rejectionReason: null,
      },
    ] as any)

    const req = new NextRequest('http://localhost/applicant/exam-only/wallet/transactions')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.transactions).toBeDefined()
    expect(json.payments).toBeDefined()
    expect(json.transactions).toHaveLength(1)
    expect(json.payments).toHaveLength(1)
    expect(json.transactions[0].amount).toBe(100)
    expect(json.transactions[0].type).toBe('TOP_UP')
    expect(json.transactions[0].status).toBe('APPROVED')
    expect(json.payments[0].amount).toBe(100)
  })
})
