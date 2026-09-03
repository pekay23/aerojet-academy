import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/permissions', () => ({
  requirePermission: vi.fn().mockResolvedValue({ id: 'staff-1', role: 'ADMIN' }),
  PERMISSIONS: { APPROVE_PAYMENTS: 'approve_payments' },
}))

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  AuditAction: {},
}))

import { POST } from '@/app/api/staff/gdpr/requests/route'
import { createAuditLog } from '@/lib/audit/logger'

function makeRequest(body: Record<string, any>) {
  return new NextRequest('http://localhost/api/staff/gdpr/requests', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

describe('POST /api/staff/gdpr/requests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.dataSubjectRequest.create.mockResolvedValue({
      id: 'dsr-1',
      userId: 'user-1',
      requestType: 'ERASURE',
      dueBy: new Date(),
    } as any)
  })

  it('creates a DSR with valid payload', async () => {
    const req = makeRequest({ userId: 'user-1', requestType: 'ERASURE' })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(prismaMock.dataSubjectRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-1', requestType: 'ERASURE' }),
      })
    )
    expect(createAuditLog).toHaveBeenCalled()
  })

  it('returns 500 for invalid requestType (Zod validation)', async () => {
    const req = makeRequest({ userId: 'user-1', requestType: 'INVALID' })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it('returns 500 when userId is missing (Zod validation)', async () => {
    const req = makeRequest({ requestType: 'ACCESS' })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it('creates DSR with optional notes', async () => {
    const req = makeRequest({ userId: 'user-1', requestType: 'ACCESS', notes: 'Urgent request' })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect(prismaMock.dataSubjectRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ notes: 'Urgent request' }),
      })
    )
  })
})
