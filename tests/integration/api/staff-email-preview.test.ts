import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

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
  wrapEmail: vi.fn().mockImplementation((subject, body) => `<html>${body}</html>`),
}))

import { GET } from '@/app/api/staff/email-preview/route.ts'
import { getAuthSession } from '@/lib/auth/helpers'

describe('GET /api/staff/email-preview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'staff-1', role: 'ADMIN' } })
  })

  describe('GET', () => {
    it('returns 401 when unauthenticated', async () => {
      ;(getAuthSession as any).mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/staff/email-preview?template=registration')
      const res = await GET(req)
      expect(res.status).toBe(401)
    })

    it('returns 400 when template is missing', async () => {
      const req = new NextRequest('http://localhost/api/staff/email-preview')
      const res = await GET(req)
      expect(res.status).toBe(400)
    })

    it('previews a built-in template', async () => {
      const req = new NextRequest('http://localhost/api/staff/email-preview?template=registration')
      const res = await GET(req)
      expect(res.status).toBe(200)
      const text = await res.text()
      expect(text).toBeDefined()
    })

    it('previews a custom template from DB', async () => {
      prismaMock.emailTemplate.findUnique.mockResolvedValueOnce({
        name: 'custom-template',
        subject: 'Hello {{firstName}}',
        body: '<p>Hi {{firstName}}</p>',
      })
      const req = new NextRequest('http://localhost/api/staff/email-preview?template=custom-template')
      const res = await GET(req)
      expect(res.status).toBe(200)
      const text = await res.text()
      expect(text).toBeDefined()
    })
  })
})
