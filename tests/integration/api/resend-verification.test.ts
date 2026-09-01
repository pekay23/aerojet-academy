import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  requireStaff: vi.fn().mockResolvedValue({ id: 'staff-1', role: 'ADMIN' }),
  generateToken: vi.fn().mockReturnValue('verify-token'),
}))

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  AuditAction: {},
}))

vi.mock('@/lib/email/service', () => ({
  sendEmailVerificationEmail: vi.fn().mockResolvedValue(undefined),
  sendActivationEmail: vi.fn().mockResolvedValue(undefined),
}))

import { POST } from '@/app/api/staff/users/[id]/resend-verification/route'
import { createAuditLog } from '@/lib/audit/logger'
import { sendEmailVerificationEmail, sendActivationEmail } from '@/lib/email/service'

function makeRequest(id: string) {
  return new NextRequest(`http://localhost/api/staff/users/${id}/resend-verification`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

describe('POST /api/staff/users/[id]/resend-verification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resends verification email to unverified user', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@example.com',
      personalEmail: 'personal@example.com',
      academyEmail: null,
      emailVerified: false,
      password: null,
      profile: { firstName: 'John' },
    } as any)
    prismaMock.user.update.mockResolvedValueOnce({ id: 'user-1' } as any)

    const req = makeRequest('user-1')
    const res = await POST(req, { params: { id: 'user-1' } })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({ verifyToken: 'verify-token' }),
      })
    )
    expect(sendEmailVerificationEmail).toHaveBeenCalledWith(
      'personal@example.com',
      'John',
      'verify-token'
    )
    expect(createAuditLog).toHaveBeenCalled()
  })

  it('returns 404 when user not found', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null)
    const req = makeRequest('user-999')
    const res = await POST(req, { params: { id: 'user-999' } })
    expect(res.status).toBe(404)
  })

  it('returns 400 when email already verified', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@example.com',
      emailVerified: true,
      profile: { firstName: 'John' },
    } as any)
    const req = makeRequest('user-1')
    const res = await POST(req, { params: { id: 'user-1' } })
    expect(res.status).toBe(400)
  })

  it('returns 400 when profile not found', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@example.com',
      emailVerified: false,
      profile: null,
    } as any)
    const req = makeRequest('user-1')
    const res = await POST(req, { params: { id: 'user-1' } })
    expect(res.status).toBe(400)
  })

  it('sends activation email when user has password', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@example.com',
      personalEmail: 'personal@example.com',
      academyEmail: 'academy@aerojet-academy.com',
      emailVerified: false,
      password: 'hashed',
      profile: { firstName: 'John' },
    } as any)
    prismaMock.user.update.mockResolvedValueOnce({ id: 'user-1' } as any)

    const req = makeRequest('user-1')
    const res = await POST(req, { params: { id: 'user-1' } })
    expect(res.status).toBe(200)
    expect(sendActivationEmail).toHaveBeenCalled()
  })
})
