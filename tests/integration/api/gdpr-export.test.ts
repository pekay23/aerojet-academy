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

vi.mock('@/lib/gdpr/export', () => ({
  buildUserDataExport: vi.fn().mockResolvedValue({ user: { id: 'user-1' }, profile: {} }),
}))

import { GET } from '@/app/api/staff/users/[id]/gdpr-export/route'
import { buildUserDataExport } from '@/lib/gdpr/export'
import { createAuditLog } from '@/lib/audit/logger'

function makeRequest(id: string) {
  return new NextRequest(`http://localhost/api/staff/users/${id}/gdpr-export`, {
    method: 'GET',
  })
}

describe('GET /api/staff/users/[id]/gdpr-export', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns JSON export with correct headers', async () => {
    const req = makeRequest('user-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'user-1' }) })
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('application/json')
    expect(res.headers.get('Content-Disposition')).toContain('gdpr-export-user-1.json')
    expect(buildUserDataExport).toHaveBeenCalledWith('user-1')
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'EXPORT', entityId: 'user-1' })
    )
  })

  it('returns 500 when export build fails', async () => {
    ;(buildUserDataExport as any).mockRejectedValueOnce(new Error('DB connection failed'))
    const req = makeRequest('user-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'user-1' }) })
    expect(res.status).toBe(500)
  })

  it('returns 401 when not authenticated', async () => {
    ;(requirePermission as any).mockRejectedValueOnce(Object.assign(new Error('Unauthorized'), { message: 'Unauthorized' }))
    const req = makeRequest('user-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'user-1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 403 when forbidden', async () => {
    ;(requirePermission as any).mockRejectedValueOnce(Object.assign(new Error('Forbidden'), { message: 'Forbidden' }))
    const req = makeRequest('user-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'user-1' }) })
    expect(res.status).toBe(403)
  })
})

// Re-import requirePermission for the mock overrides above
import { requirePermission } from '@/lib/auth/permissions'
