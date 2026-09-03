import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'

vi.mock('@/lib/auth/helpers', () => ({
  requireStaff: vi.fn(),
}))

vi.mock('@/lib/api/response', () => ({
  withErrorHandler: vi.fn((fn: any) => {
    return async (req: any, ctx?: any) => {
      try {
        const resolvedCtx = ctx?.params ? { ...ctx, params: await ctx.params } : ctx
        return await fn(req, resolvedCtx)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        if (message === 'Unauthorized')
          return { status: 401, json: () => Promise.resolve({ error: 'Unauthorized' }) }
        if (message === 'Forbidden')
          return { status: 403, json: () => Promise.resolve({ error: 'Forbidden' }) }
        return { status: 500, json: () => Promise.resolve({ error: 'Internal Server Error' }) }
      }
    }
  }),
  apiError: vi.fn((message: any, status?: number) => ({
    status: status || 400,
    json: () => Promise.resolve({ message, error: message }),
  })),
  apiSuccess: vi.fn((data: any) => ({ status: 200, json: () => Promise.resolve(data) })),
}))

vi.mock('@/lib/analytics/queries', () => ({
  getUserJourney: vi.fn(),
}))

import { GET } from '@/app/api/staff/analytics/journey/[id]/route'
import { requireStaff } from '@/lib/auth/helpers'
import { getUserJourney } from '@/lib/analytics/queries'

describe('GET /api/staff/analytics/journey/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
  })

  it('returns user journey data', async () => {
    ;(requireStaff as any).mockResolvedValue(undefined)
    ;(getUserJourney as any).mockResolvedValue([{ id: 'event-1', action: 'login' }])
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      role: 'STUDENT',
      createdAt: new Date('2024-01-01'),
      lastSeenAt: new Date('2024-06-01'),
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        profilePhotoUrl: 'https://example.com/photo.jpg',
      },
      studentProfile: { studentId: 'STU001' },
    } as any)

    const req = new Request('http://localhost/api/staff/analytics/journey/user-1')
    const ctx = { params: Promise.resolve({ id: 'user-1' }) }
    const res = await GET(req as any, ctx as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.user).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      role: 'STUDENT',
      createdAt: expect.any(Date),
      lastSeenAt: expect.any(Date),
      firstName: 'John',
      lastName: 'Doe',
      avatarUrl: 'https://example.com/photo.jpg',
      studentId: 'STU001',
    })
    expect(json.events).toEqual([{ id: 'event-1', action: 'login' }])
  })

  it('returns 404 when user not found', async () => {
    ;(requireStaff as any).mockResolvedValue(undefined)
    ;(getUserJourney as any).mockResolvedValue([])
    prismaMock.user.findUnique.mockResolvedValue(null as any)

    const req = new Request('http://localhost/api/staff/analytics/journey/nonexistent')
    const ctx = { params: Promise.resolve({ id: 'nonexistent' }) }
    const res = await GET(req as any, ctx as any)
    expect(res.status).toBe(404)
  })
})
