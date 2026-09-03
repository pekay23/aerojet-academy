import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStaff: vi.fn(),
  requireAdmin: vi.fn(),
  requireAuth: vi.fn(),
}))

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  AuditAction: {
    EXAM_SESSION_STARTED: 'EXAM_SESSION_STARTED',
  },
}))

import { GET } from '@/app/api/staff/exams/internal/sessions/[id]/seb-config/route'

function makeSession(overrides: Record<string, any> = {}) {
  return {
    id: 'session-1',
    bankId: 'bank-1',
    classId: 'class-1',
    studentId: 'student-1',
    expiresAt: new Date(Date.now() + 3600 * 1000),
    bank: { id: 'bank-1', name: 'Test Bank' },
    class: { id: 'class-1', name: 'Test Class' },
    ...overrides,
  }
}

function makeSchedule(overrides: Record<string, any> = {}) {
  return {
    id: 'schedule-1',
    bankId: 'bank-1',
    classId: 'class-1',
    sebRequired: true,
    ...overrides,
  }
}

describe('GET /api/staff/exams/internal/sessions/[id]/seb-config', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns 400 when sessionId is missing', async () => {
    const { getAuthSession } = await import('@/lib/auth/helpers')
    vi.mocked(getAuthSession).mockResolvedValue({ user: { role: 'STAFF' } } as any)

    const req = new NextRequest('http://localhost/api/staff/exams/internal/sessions/session-1/seb-config')
    const res = await GET(req, { params: Promise.resolve({ id: 'session-1' }) })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('sessionId is required')
  })

  it('returns 404 when session not found', async () => {
    const { getAuthSession } = await import('@/lib/auth/helpers')
    vi.mocked(getAuthSession).mockResolvedValue({ user: { role: 'STAFF' } } as any)
    prismaMock.internalExamSession.findUnique.mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost/api/staff/exams/internal/sessions/session-1/seb-config?sessionId=session-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'session-1' }) })
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('Session not found')
  })

  it('returns 400 when session has no class', async () => {
    const { getAuthSession } = await import('@/lib/auth/helpers')
    vi.mocked(getAuthSession).mockResolvedValue({ user: { role: 'STAFF' } } as any)
    prismaMock.internalExamSession.findUnique.mockResolvedValueOnce(
      makeSession({ classId: null, class: null }) as any
    )

    const req = new NextRequest('http://localhost/api/staff/exams/internal/sessions/session-1/seb-config?sessionId=session-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'session-1' }) })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('This session is not tied to a class schedule')
  })

  it('returns 403 when SEB is not required', async () => {
    const { getAuthSession } = await import('@/lib/auth/helpers')
    vi.mocked(getAuthSession).mockResolvedValue({ user: { role: 'STAFF' } } as any)
    prismaMock.internalExamSession.findUnique.mockResolvedValueOnce(makeSession() as any)
    prismaMock.internalExamClassSchedule.findFirst.mockResolvedValueOnce(
      makeSchedule({ sebRequired: false }) as any
    )

    const req = new NextRequest('http://localhost/api/staff/exams/internal/sessions/session-1/seb-config?sessionId=session-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'session-1' }) })
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toBe('SEB is not required for this exam schedule')
  })

  it('returns 403 when no schedule found', async () => {
    const { getAuthSession } = await import('@/lib/auth/helpers')
    vi.mocked(getAuthSession).mockResolvedValue({ user: { role: 'STAFF' } } as any)
    prismaMock.internalExamSession.findUnique.mockResolvedValueOnce(makeSession() as any)
    prismaMock.internalExamClassSchedule.findFirst.mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost/api/staff/exams/internal/sessions/session-1/seb-config?sessionId=session-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'session-1' }) })
    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toBe('SEB is not required for this exam schedule')
  })

  it('returns .seb file for valid session with SEB required', async () => {
    const { getAuthSession } = await import('@/lib/auth/helpers')
    vi.mocked(getAuthSession).mockResolvedValue({ user: { role: 'STAFF' } } as any)
    prismaMock.internalExamSession.findUnique.mockResolvedValueOnce(makeSession() as any)
    prismaMock.internalExamClassSchedule.findFirst.mockResolvedValueOnce(
      makeSchedule({ sebRequired: true }) as any
    )

    const req = new NextRequest('http://localhost/api/staff/exams/internal/sessions/session-1/seb-config?sessionId=session-1')
    const res = await GET(req, { params: Promise.resolve({ id: 'session-1' }) })
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/octet-stream')
    expect(res.headers.get('Content-Disposition')).toContain('.seb')
  })

  it('stores BEK pair in session record', async () => {
    const { getAuthSession } = await import('@/lib/auth/helpers')
    vi.mocked(getAuthSession).mockResolvedValue({ user: { role: 'STAFF' } } as any)
    prismaMock.internalExamSession.findUnique.mockResolvedValueOnce(makeSession() as any)
    prismaMock.internalExamClassSchedule.findFirst.mockResolvedValueOnce(
      makeSchedule({ sebRequired: true }) as any
    )

    const req = new NextRequest('http://localhost/api/staff/exams/internal/sessions/session-1/seb-config?sessionId=session-1')
    await GET(req, { params: Promise.resolve({ id: 'session-1' }) })

    expect(prismaMock.internalExamSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'session-1' },
        data: { sebKeys: expect.any(Object) },
      })
    )
  })

  it('creates audit log on successful generation', async () => {
    const { getAuthSession } = await import('@/lib/auth/helpers')
    const { createAuditLog } = await import('@/lib/audit/logger')
    vi.mocked(getAuthSession).mockResolvedValue({ user: { role: 'STAFF' } } as any)
    prismaMock.internalExamSession.findUnique.mockResolvedValueOnce(makeSession() as any)
    prismaMock.internalExamClassSchedule.findFirst.mockResolvedValueOnce(
      makeSchedule({ sebRequired: true }) as any
    )

    const req = new NextRequest('http://localhost/api/staff/exams/internal/sessions/session-1/seb-config?sessionId=session-1')
    await GET(req, { params: Promise.resolve({ id: 'session-1' }) })

    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'EXAM_SESSION_STARTED',
        entityId: 'session-1',
      })
    )
  })
})
