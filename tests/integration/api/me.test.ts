import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireAuth: vi.fn(),
  verifyPassword: vi.fn().mockResolvedValue(true),
  hashPassword: vi.fn().mockResolvedValue('$hashed$'),
  generateToken: vi.fn().mockReturnValue('verify-token'),
  generateTempPassword: vi.fn().mockReturnValue('TempPass1!'),
  generateAcademyEmail: vi.fn().mockResolvedValue('j.doe@aerojet-academy.com'),
}))

import { POST } from '@/app/api/me/heartbeat/route'
import { GET, PATCH } from '@/app/api/me/privacy/route'
import { requireAuth } from '@/lib/auth/helpers'

const mockUser = { id: 'user-1', role: 'STUDENT', email: 'student@test.com' }

describe('Me — POST /api/me/heartbeat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireAuth as any).mockResolvedValue(mockUser)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireAuth as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/api/me/heartbeat', { method: 'POST' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('updates lastSeenAt and returns ok:true', async () => {
    prismaMock.user.update.mockResolvedValueOnce({ id: 'user-1', lastSeenAt: new Date() } as any)

    const req = new NextRequest('http://localhost/api/me/heartbeat', { method: 'POST' })
    const res = await POST(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.ok).toBe(true)

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: { lastSeenAt: expect.any(Date) },
      })
    )
  })
})

describe('Me — GET /api/me/privacy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireAuth as any).mockResolvedValue(mockUser)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireAuth as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/api/me/privacy', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns current showLastSeen setting', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ showLastSeen: true } as any)

    const req = new NextRequest('http://localhost/api/me/privacy', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.showLastSeen).toBe(true)
  })

  it('defaults showLastSeen to false when null', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ showLastSeen: null } as any)

    const req = new NextRequest('http://localhost/api/me/privacy', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data.showLastSeen).toBe(false)
  })
})

describe('Me — PATCH /api/me/privacy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireAuth as any).mockResolvedValue(mockUser)
  })

  it('returns 401 when unauthenticated', async () => {
    ;(requireAuth as any).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/api/me/privacy', {
      method: 'PATCH',
      body: JSON.stringify({ showLastSeen: true }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(401)
  })

  it('returns 500 for invalid body (schema.parse throws)', async () => {
    const req = new NextRequest('http://localhost/api/me/privacy', {
      method: 'PATCH',
      body: JSON.stringify({ showLastSeen: 'yes' }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(500)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toBeDefined()
  })

  it('toggles showLastSeen to true', async () => {
    prismaMock.user.update.mockResolvedValueOnce({ id: 'user-1', showLastSeen: true } as any)

    const req = new NextRequest('http://localhost/api/me/privacy', {
      method: 'PATCH',
      body: JSON.stringify({ showLastSeen: true }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.showLastSeen).toBe(true)

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: { showLastSeen: true },
      })
    )
  })

  it('toggles showLastSeen to false', async () => {
    prismaMock.user.update.mockResolvedValueOnce({ id: 'user-1', showLastSeen: false } as any)

    const req = new NextRequest('http://localhost/api/me/privacy', {
      method: 'PATCH',
      body: JSON.stringify({ showLastSeen: false }),
    })
    const res = await PATCH(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data.showLastSeen).toBe(false)

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: { showLastSeen: false },
      })
    )
  })
})
