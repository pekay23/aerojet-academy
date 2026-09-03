import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStaff: vi.fn(),
  hashPassword: vi.fn().mockResolvedValue('$hashed$'),
  generateToken: vi.fn().mockReturnValue('verify-token'),
  generateTempPassword: vi.fn().mockReturnValue('TempPass1!'),
  generateAcademyEmail: vi.fn().mockResolvedValue('j.doe@aerojet-academy.com'),
  checkRateLimit: vi.fn().mockReturnValue(true),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}))

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  AuditAction: { UPDATE: 'UPDATE' },
}))

vi.mock('@/lib/analytics/events', () => ({
  trackPaymentSubmitted: vi.fn().mockResolvedValue(undefined),
}))

import { POST } from '@/app/api/public/submit-payment-proof/route'
import { createAuditLog } from '@/lib/audit/logger'

function makeRequest(body: Record<string, any>) {
  return new NextRequest('http://localhost/api/public/submit-payment-proof', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('POST /api/public/submit-payment-proof', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock))
  })

  it('submits payment proof successfully', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      registrationCode: 'REG-123',
      emailVerified: true,
      registrationPaid: false,
      registrationFee: { toNumber: () => 500, valueOf: () => 500 },
      registrationCurrency: 'EUR',
      profile: { firstName: 'John' },
    } as any)
    prismaMock.user.update.mockResolvedValueOnce({ id: 'user-1', status: 'PENDING' } as any)
    prismaMock.payment.create.mockResolvedValueOnce({ id: 'pay-1', amount: 500, currency: 'EUR' } as any)

    const req = makeRequest({ registrationCode: 'REG-123', proofUrl: 'https://example.com/proof.pdf' })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({ paymentProofUrl: 'https://example.com/proof.pdf', status: 'PENDING' }),
      })
    )
    expect(prismaMock.payment.create).toHaveBeenCalled()
    expect(createAuditLog).toHaveBeenCalled()
  })

  it('returns 404 when registration code not found', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null)
    const req = makeRequest({ registrationCode: 'INVALID', proofUrl: 'https://example.com/proof.pdf' })
    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('returns 400 when proofUrl is missing', async () => {
    const req = makeRequest({ registrationCode: 'REG-123' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 403 when email not verified', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      registrationCode: 'REG-123',
      emailVerified: false,
      registrationPaid: false,
      profile: { firstName: 'John' },
    } as any)

    const req = makeRequest({ registrationCode: 'REG-123', proofUrl: 'https://example.com/proof.pdf' })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('returns 400 when registration already paid', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      registrationCode: 'REG-123',
      emailVerified: true,
      registrationPaid: true,
      profile: { firstName: 'John' },
    } as any)

    const req = makeRequest({ registrationCode: 'REG-123', proofUrl: 'https://example.com/proof.pdf' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 429 when rate limited', async () => {
    const { checkRateLimit } = await import('@/lib/auth/helpers')
    ;(checkRateLimit as any).mockReturnValueOnce(false)
    const req = makeRequest({ registrationCode: 'REG-123', proofUrl: 'https://example.com/proof.pdf' })
    const res = await POST(req)
    expect(res.status).toBe(429)
  })
})
