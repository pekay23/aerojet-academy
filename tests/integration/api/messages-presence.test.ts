import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

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

vi.mock('@/lib/presence', () => ({
  resolvePresenceForViewer: vi.fn(),
  ONLINE_THRESHOLD_MS: 90000,
}))

import { GET } from '@/app/api/messages/presence/route'
import { requireAuth } from '@/lib/auth/helpers'
import { resolvePresenceForViewer } from '@/lib/presence'

describe('GET /api/messages/presence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireAuth as any).mockResolvedValue({ id: 'user-1', role: 'STUDENT' })
    ;(resolvePresenceForViewer as any).mockResolvedValue([])
  })

  it('returns empty array with no ids', async () => {
    const req = new NextRequest('http://localhost/api/messages/presence')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toEqual([])
  })

  it('returns presence entries for peers', async () => {
    ;(resolvePresenceForViewer as any).mockResolvedValue([
      { userId: 'u2', online: true, lastSeenAt: new Date().toISOString() },
      { userId: 'u3', online: false, lastSeenAt: null },
    ])

    const req = new NextRequest('http://localhost/api/messages/presence?id=u2&id=u3')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveLength(2)
    expect(json.data[0].online).toBe(true)
  })
})
