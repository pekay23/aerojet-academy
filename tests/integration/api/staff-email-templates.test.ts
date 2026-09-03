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

import { GET } from '@/app/api/staff/email-templates/route'
import { POST } from '@/app/api/staff/email-templates/route'
import { DELETE } from '@/app/api/staff/email-templates/route'
import { getAuthSession } from '@/lib/auth/helpers'

describe('GET/POST/DELETE /api/staff/email-templates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'staff-1', role: 'ADMIN' } })
  })

  describe('GET', () => {
    it('returns list of templates', async () => {
      prismaMock.emailTemplate.findMany.mockResolvedValueOnce([{ id: '1', name: 'test' }])
      const req = new NextRequest('http://localhost/api/staff/email-templates')
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })

    it('returns empty list when no data', async () => {
      prismaMock.emailTemplate.findMany.mockResolvedValueOnce([])
      const req = new NextRequest('http://localhost/api/staff/email-templates')
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })

    it('returns a single template by name', async () => {
      prismaMock.emailTemplate.findUnique.mockResolvedValueOnce({ id: '1', name: 'test-template' })
      const req = new NextRequest('http://localhost/api/staff/email-templates?name=test-template')
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })
  })

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      ;(getAuthSession as any).mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/staff/email-templates', {
        method: 'POST',
        body: JSON.stringify({ name: 'test', subject: 'hi', body: 'body' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })

    it('creates a template', async () => {
      prismaMock.emailTemplate.upsert.mockResolvedValueOnce({ id: '1', name: 'new-template' })
      const req = new NextRequest('http://localhost/api/staff/email-templates', {
        method: 'POST',
        body: JSON.stringify({ name: 'new-template', subject: 'Hello', body: '<p>Body</p>' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })
  })

  describe('DELETE', () => {
    it('returns 401 when unauthenticated', async () => {
      ;(getAuthSession as any).mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/staff/email-templates?name=test-template', {
        method: 'DELETE',
      })
      const res = await DELETE(req)
      expect(res.status).toBe(401)
    })

    it('returns 400 when name is missing', async () => {
      const req = new NextRequest('http://localhost/api/staff/email-templates', {
        method: 'DELETE',
      })
      const res = await DELETE(req)
      expect(res.status).toBe(400)
    })

    it('deletes a template', async () => {
      prismaMock.emailTemplate.delete.mockResolvedValueOnce(undefined)
      const req = new NextRequest('http://localhost/api/staff/email-templates?name=test-template', {
        method: 'DELETE',
      })
      const res = await DELETE(req)
      expect(res.status).toBe(204)
    })
  })
})
