import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  requireStaff: vi.fn().mockResolvedValue({ id: 'staff-1', role: 'ADMIN' }),
  hashPassword: vi.fn().mockResolvedValue('$hashed$'),
  generateToken: vi.fn().mockReturnValue('verify-token'),
  generateTempPassword: vi.fn().mockReturnValue('TempPass1!'),
}))

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  AuditAction: {},
}))

vi.mock('@/lib/email/service', () => ({
  sendActivationEmail: vi.fn().mockResolvedValue(undefined),
  sendStudentPromotionEmail: vi.fn().mockResolvedValue(undefined),
}))

import { POST } from '@/app/api/staff/users/[id]/resend-credentials/route'
import { createAuditLog } from '@/lib/audit/logger'
import { sendActivationEmail } from '@/lib/email/service'

function makeRequest(id: string) {
  return new NextRequest(`http://localhost/api/staff/users/${id}/resend-credentials`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

describe('POST /api/staff/users/[id]/resend-credentials', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resends credentials to a user', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@example.com',
      personalEmail: 'personal@example.com',
      academyEmail: 'academy@aerojet-academy.com',
      role: 'APPLICANT',
      password: 'hashed',
      profile: { firstName: 'John' },
      studentProfile: null,
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
        data: expect.objectContaining({
          password: '$hashed$',
          verifyToken: 'verify-token',
          mustChangePassword: true,
        }),
      })
    )
    expect(sendActivationEmail).toHaveBeenCalled()
    expect(createAuditLog).toHaveBeenCalled()
  })

  it('returns 404 when user not found', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null)
    const req = makeRequest('user-999')
    const res = await POST(req, { params: { id: 'user-999' } })
    expect(res.status).toBe(404)
  })

  it('returns 400 when profile not found', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@example.com',
      profile: null,
    } as any)
    const req = makeRequest('user-1')
    const res = await POST(req, { params: { id: 'user-1' } })
    expect(res.status).toBe(400)
  })

  it('sends promotion email for STUDENT role', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@example.com',
      personalEmail: 'personal@example.com',
      academyEmail: null,
      role: 'STUDENT',
      password: 'hashed',
      profile: { firstName: 'John' },
      studentProfile: { studentId: 'STU-001' },
    } as any)
    prismaMock.user.update.mockResolvedValueOnce({ id: 'user-1' } as any)

    const req = makeRequest('user-1')
    const res = await POST(req, { params: { id: 'user-1' } })
    expect(res.status).toBe(200)
    const { sendStudentPromotionEmail } = await import('@/lib/email/service')
    expect(sendStudentPromotionEmail).toHaveBeenCalled()
  })
})
