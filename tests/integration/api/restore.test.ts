import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn().mockResolvedValue({ user: { id: 'staff-1', role: 'ADMIN' } }),
}))

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  AuditAction: {},
}))

import { POST } from '@/app/api/staff/users/[id]/restore/route'
import { createAuditLog } from '@/lib/audit/logger'

function makeRequest(id: string) {
  return new NextRequest(`http://localhost/api/staff/users/${id}/restore`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

describe('POST /api/staff/users/[id]/restore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('restores archived user to active', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@example.com',
      status: 'ARCHIVED',
    } as any)
    prismaMock.user.update.mockResolvedValueOnce({ id: 'user-1', status: 'ACTIVE' } as any)

    const req = makeRequest('user-1')
    const res = await POST(req, { params: { id: 'user-1' } })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: { status: 'ACTIVE' },
      })
    )
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'UPDATE',
        description: expect.stringContaining('restored'),
      })
    )
  })

  it('returns 404 when user not found', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null)
    const req = makeRequest('user-999')
    const res = await POST(req, { params: { id: 'user-999' } })
    expect(res.status).toBe(404)
  })

  it('returns 401 when not authenticated', async () => {
    const { getAuthSession } = await import('@/lib/auth/helpers')
    ;(getAuthSession as any).mockResolvedValueOnce(null)
    const req = makeRequest('user-1')
    const res = await POST(req, { params: { id: 'user-1' } })
    expect(res.status).toBe(401)
  })

  it('returns 401 when role is unauthorized', async () => {
    const { getAuthSession } = await import('@/lib/auth/helpers')
    ;(getAuthSession as any).mockResolvedValueOnce({ user: { id: 'user-2', role: 'STUDENT' } })
    const req = makeRequest('user-1')
    const res = await POST(req, { params: { id: 'user-1' } })
    expect(res.status).toBe(401)
  })
})
