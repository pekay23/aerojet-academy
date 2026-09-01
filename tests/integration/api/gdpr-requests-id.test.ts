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

import { PATCH } from '@/app/api/staff/gdpr/requests/[id]/route'
import { createAuditLog } from '@/lib/audit/logger'

function makeRequest(body: Record<string, any>) {
  return new NextRequest('http://localhost/api/staff/gdpr/requests/dsr-1', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

describe('PATCH /api/staff/gdpr/requests/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates DSR status to COMPLETED', async () => {
    prismaMock.dataSubjectRequest.findUnique.mockResolvedValueOnce({
      id: 'dsr-1',
      status: 'IN_PROGRESS',
      completedAt: null,
    } as any)
    prismaMock.dataSubjectRequest.update.mockResolvedValueOnce({
      id: 'dsr-1',
      status: 'COMPLETED',
      completedAt: new Date(),
    } as any)

    const req = makeRequest({ status: 'COMPLETED' })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'dsr-1' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(prismaMock.dataSubjectRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'dsr-1' },
        data: expect.objectContaining({ status: 'COMPLETED' }),
      })
    )
    expect(createAuditLog).toHaveBeenCalled()
  })

  it('returns 404 when DSR not found', async () => {
    prismaMock.dataSubjectRequest.findUnique.mockResolvedValueOnce(null)
    const req = makeRequest({ status: 'IN_PROGRESS' })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'dsr-999' }) })
    expect(res.status).toBe(404)
  })

  it('returns 500 for invalid status value (Zod validation)', async () => {
    const req = makeRequest({ status: 'INVALID_STATUS' })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'dsr-1' }) })
    expect(res.status).toBe(500)
  })

  it('updates assignedToId', async () => {
    prismaMock.dataSubjectRequest.findUnique.mockResolvedValueOnce({
      id: 'dsr-1',
      status: 'RECEIVED',
      completedAt: null,
    } as any)
    prismaMock.dataSubjectRequest.update.mockResolvedValueOnce({
      id: 'dsr-1',
      assignedToId: 'staff-2',
    } as any)

    const req = makeRequest({ assignedToId: 'staff-2' })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'dsr-1' }) })
    expect(res.status).toBe(200)
    expect(prismaMock.dataSubjectRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ assignedToId: 'staff-2' }),
      })
    )
  })
})
