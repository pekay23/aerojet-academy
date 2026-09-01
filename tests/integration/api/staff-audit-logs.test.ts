import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/permissions', () => ({
  requirePermission: vi.fn().mockResolvedValue({ id: 'staff-1', role: 'ADMIN' }),
  PERMISSIONS: { VIEW_AUDIT_LOGS: 'view_audit_logs' },
}))

vi.mock('@/lib/audit/logger', () => ({
  queryAuditLogs: vi.fn(),
  createAuditLog: vi.fn(),
  AuditAction: { CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE' },
}))

vi.mock('@/lib/audit/logger', () => ({
  queryAuditLogs: vi.fn(),
  createAuditLog: vi.fn(),
  AuditAction: { CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE' },
}))

vi.mock('@/lib/api/response', () => ({
  apiPaginated: vi.fn((data: any, total: number) => ({ status: 200, json: () => Promise.resolve({ data, total }) })),
  withErrorHandler: vi.fn((fn: any) => {
    return async (req: any) => {
      try {
        return await fn(req)
      } catch (err: any) {
        const message = err instanceof Error ? err.message : String(err)
        if (message === 'Unauthorized') return { status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) }
        if (message === 'Forbidden') return { status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) }
        return { status: 500, json: () => Promise.resolve({ error: 'Internal Server Error' }) }
      }
    }
  }),
  parsePagination: vi.fn().mockReturnValue({ page: 1, limit: 20, skip: 0 }),
}))

import { GET } from '@/app/api/staff/audit-logs/route'
import { queryAuditLogs } from '@/lib/audit/logger'

function makeAuditLog(overrides: Record<string, any> = {}) {
  return {
    id: 'log-1',
    action: 'USER_ROLE_CHANGED',
    entity: 'User',
    entityId: 'user-1',
    userId: 'staff-1',
    description: 'STUDENT → INSTRUCTOR',
    changes: { before: { role: 'STUDENT' }, after: { role: 'INSTRUCTOR' } },
    createdAt: new Date('2026-08-29T10:00:00Z'),
    ...overrides,
  }
}

describe('Staff Audit Logs — GET /api/staff/audit-logs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when permission is denied', async () => {
    const { requirePermission } = await import('@/lib/auth/permissions')
    vi.mocked(requirePermission).mockRejectedValueOnce(new Error('Unauthorized'))

    const req = new NextRequest('http://localhost/api/staff/audit-logs')
    const res = await GET(req)
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 403 when forbidden', async () => {
    const { requirePermission } = await import('@/lib/auth/permissions')
    vi.mocked(requirePermission).mockRejectedValueOnce(new Error('Forbidden'))

    const req = new NextRequest('http://localhost/api/staff/audit-logs')
    const res = await GET(req)
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toBe('Forbidden')
  })

  it('returns paginated audit logs with filters', async () => {
    const logs = [makeAuditLog(), makeAuditLog({ id: 'log-2', action: 'PAYMENT_APPROVE' })]

    vi.mocked(queryAuditLogs).mockResolvedValueOnce({ logs: logs as any, total: 2 })

    const req = new NextRequest('http://localhost/api/staff/audit-logs?page=1&limit=20&action=USER_ROLE_CHANGED')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(2)
    expect(json.total).toBe(2)

    expect(queryAuditLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'USER_ROLE_CHANGED',
        limit: 20,
        offset: 0,
      })
    )
  })

  it('passes date filters through to queryAuditLogs', async () => {
    vi.mocked(queryAuditLogs).mockResolvedValueOnce({ logs: [], total: 0 })

    const req = new NextRequest(
      'http://localhost/api/staff/audit-logs?startDate=2026-08-01&endDate=2026-08-29&userId=user-1'
    )
    const res = await GET(req)
    expect(res.status).toBe(200)

    expect(queryAuditLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      })
    )
  })

  it('returns empty result set when no logs match', async () => {
    vi.mocked(queryAuditLogs).mockResolvedValueOnce({ logs: [], total: 0 })

    const req = new NextRequest('http://localhost/api/staff/audit-logs?action=NONEXISTENT')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toEqual([])
    expect(json.total).toBe(0)
  })
})
