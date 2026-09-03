import { describe, it, expect, vi } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStaff: vi.fn().mockResolvedValue({ id: 'staff-1', role: 'ADMIN' }),
  requireAdmin: vi.fn(),
  requireAuth: vi.fn(),
  hashPassword: vi.fn(),
  generateToken: vi.fn(),
  generateTempPassword: vi.fn(),
  generateAcademyEmail: vi.fn(),
}))

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  AuditAction: {},
  queryAuditLogs: vi.fn(),
}))

vi.mock('@/lib/api/response', () => ({
  apiSuccess: vi.fn((data: any) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiError: vi.fn((message: any, status?: number) => ({
    status: status || 400,
    json: () => Promise.resolve({ message, error: message }),
  })),
  apiCreated: vi.fn((data: any) => ({ status: 201, json: () => Promise.resolve(data) })),
  withErrorHandler: vi.fn((fn: any) => {
    return async (req: any, ctx: any) => {
      try {
        return await fn(req, ctx)
      } catch (err: any) {
        const message = err instanceof Error ? err.message : String(err)
        if (message === 'Unauthorized')
          return { status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) }
        if (message === 'Forbidden')
          return { status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) }
        return {
          status: 500,
          json: () => Promise.resolve({ error: 'Internal Server Error', details: message }),
        }
      }
    }
  }),
}))

import { GET } from '@/app/api/staff/programmes/route'

describe('debug programmes', () => {
  it('debug GET', async () => {
    console.log('keys', Object.keys(prismaMock))
    console.log('fullTimeProgramme', prismaMock.fullTimeProgramme)
    prismaMock.fullTimeProgramme.findMany.mockResolvedValueOnce([{ id: '1', code: 'TEST' }] as any)
    const req = new NextRequest('http://localhost/api/staff/programmes')
    const res = await GET(req)
    console.log('status', res.status)
    console.log('json', await res.json())
    expect(res.status).toBe(200)
  })
})
