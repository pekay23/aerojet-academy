import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  requireStaff: vi.fn().mockResolvedValue({ id: 'staff-1', role: 'ADMIN' }),
}))

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  AuditAction: {},
}))

import { POST } from '@/app/api/staff/users/[id]/toggle-password-change/route'
import { createAuditLog } from '@/lib/audit/logger'

function makeRequest(id: string) {
  return new NextRequest(`http://localhost/api/staff/users/${id}/toggle-password-change`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

describe('POST /api/staff/users/[id]/toggle-password-change', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('toggles mustChangePassword from false to true', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@example.com',
      mustChangePassword: false,
      passwordChanged: true,
    } as any)
    prismaMock.user.update.mockResolvedValueOnce({ id: 'user-1', mustChangePassword: true } as any)

    const req = makeRequest('user-1')
    const res = await POST(req, { params: { id: 'user-1' } })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.mustChangePassword).toBe(true)
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: { mustChangePassword: true },
      })
    )
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ description: expect.stringContaining('Re-enabled') })
    )
  })

  it('toggles mustChangePassword from true to false', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      email: 'user@example.com',
      mustChangePassword: true,
      passwordChanged: false,
    } as any)
    prismaMock.user.update.mockResolvedValueOnce({ id: 'user-1', mustChangePassword: false } as any)

    const req = makeRequest('user-1')
    const res = await POST(req, { params: { id: 'user-1' } })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.mustChangePassword).toBe(false)
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ description: expect.stringContaining('Bypassed') })
    )
  })

  it('returns 404 when user not found', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null)
    const req = makeRequest('user-999')
    const res = await POST(req, { params: { id: 'user-999' } })
    expect(res.status).toBe(404)
  })

  it('returns 400 when id is missing', async () => {
    const req = makeRequest('')
    const res = await POST(req, { params: { id: '' } })
    expect(res.status).toBe(400)
  })
})
