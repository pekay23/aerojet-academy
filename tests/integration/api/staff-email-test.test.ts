import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest, NextResponse } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStaff: vi.fn(),
  requireAdmin: vi.fn(),
  requireAuth: vi.fn(),
  hashPassword: vi.fn(),
  generateToken: vi.fn(),
  generateTempPassword: vi.fn(),
  generateAcademyEmail: vi.fn(),
  getClientIp: vi.fn(),
  verifyPassword: vi.fn(),
  generateStudentId: vi.fn(),
  checkRateLimit: vi.fn(),
  requireStudent: vi.fn(),
  requireInstructor: vi.fn(),
  requireApplicant: vi.fn(),
  requireAdminOrStaff: vi.fn(),
  requireExaminer: vi.fn(),
  generateRegistrationCode: vi.fn(),
}))

vi.mock('@/lib/email/service', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  sendBulkEmails: vi.fn().mockResolvedValue(undefined),
  renderRegistrationEmail: vi.fn().mockResolvedValue('<html>registration</html>'),
  renderEmailVerificationEmail: vi.fn().mockResolvedValue('<html>verification</html>'),
  renderActivationEmail: vi.fn().mockResolvedValue('<html>activation</html>'),
  renderStudentPromotionEmail: vi.fn().mockResolvedValue('<html>promotion</html>'),
  renderPasswordResetEmail: vi.fn().mockResolvedValue('<html>reset</html>'),
  renderPaymentApprovedEmail: vi.fn().mockResolvedValue('<html>payment-approved</html>'),
  renderPaymentRejectedEmail: vi.fn().mockResolvedValue('<html>payment-rejected</html>'),
  renderPoolConfirmedEmail: vi.fn().mockResolvedValue('<html>pool-confirmed</html>'),
  renderContactEnquiryConfirmation: vi.fn().mockResolvedValue('<html>contact</html>'),
}))

import { POST } from '@/app/api/staff/email-test/route.ts'
import { getAuthSession } from '@/lib/auth/helpers'

describe('POST /api/staff/email-test', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'staff-1', role: 'ADMIN', email: 'staff@test.com' } })
  })

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      ;(getAuthSession as any).mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/staff/email-test', {
        method: 'POST',
        body: JSON.stringify({ templateName: 'registration' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })

    it('returns 400 when no template specified', async () => {
      const req = new NextRequest('http://localhost/api/staff/email-test', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('sends a single template', async () => {
      const req = new NextRequest('http://localhost/api/staff/email-test', {
        method: 'POST',
        body: JSON.stringify({ templateName: 'registration' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
      expect(json.results).toBeDefined()
      expect(json.results.length).toBe(1)
    })

    it('sends all templates when sendAll is true', async () => {
      const req = new NextRequest('http://localhost/api/staff/email-test', {
        method: 'POST',
        body: JSON.stringify({ sendAll: true }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
      expect(json.results).toBeDefined()
      expect(json.results.length).toBeGreaterThan(1)
    })
  })
})
