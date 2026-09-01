import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest, NextResponse } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStaff: vi.fn(),
  requireStudent: vi.fn(),
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
  requireInstructor: vi.fn(),
  requireApplicant: vi.fn(),
  hashPassword: vi.fn(),
  generateToken: vi.fn(),
  generateTempPassword: vi.fn(),
  generateAcademyEmail: vi.fn(),
}))

import { GET, PATCH } from '@/app/api/student/notifications/route'
import { requireStudent } from '@/lib/auth/helpers'

describe('GET /api/student/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireStudent as any).mockResolvedValue({ id: 'student-1', role: 'STUDENT' })
    prismaMock.notification.findMany.mockResolvedValue([])
    prismaMock.notification.updateMany.mockResolvedValue({ count: 0 } as any)
  })

  it('returns notifications list', async () => {
    const notifications = [
      { id: 'n1', message: 'Test', isRead: false, createdAt: new Date('2026-01-01') },
    ]
    prismaMock.notification.findMany.mockResolvedValue(notifications)

    const req = new NextRequest('http://localhost/api/student/notifications')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(1)
  })

  it('returns empty list when no notifications', async () => {
    prismaMock.notification.findMany.mockResolvedValue([])

    const req = new NextRequest('http://localhost/api/student/notifications')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(0)
  })
})

describe('PATCH /api/student/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireStudent as any).mockResolvedValue({ id: 'student-1', role: 'STUDENT' })
    prismaMock.notification.updateMany.mockResolvedValue({ count: 2 } as any)
  })

  it('marks specific notifications as read', async () => {
    const req = new NextRequest('http://localhost/api/student/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ ids: ['n1', 'n2'] }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.message).toBe('Notifications marked as read')
  })

  it('marks all notifications as read when no ids provided', async () => {
    const req = new NextRequest('http://localhost/api/student/notifications', {
      method: 'PATCH',
      body: JSON.stringify({}),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.message).toBe('Notifications marked as read')
  })
})
