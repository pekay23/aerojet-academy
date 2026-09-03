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

vi.mock('@/app/api/badge-counts/cache', () => ({
  BadgeCountsCache: class BadgeCountsCache {
    private static instance: any
    private globalCache = new Map()
    private userCache = new Map()
    static getInstance() {
      if (!BadgeCountsCache.instance) BadgeCountsCache.instance = new BadgeCountsCache()
      return BadgeCountsCache.instance
    }
    getGlobal(key: string) {
      return this.globalCache.get(key)?.data ?? null
    }
    setGlobal(key: string, data: any) {
      this.globalCache.set(key, { data, timestamp: new Date() })
    }
    getUser(userId: string, key: string) {
      const k = `${userId}:${key}`
      return this.userCache.get(k)?.data ?? null
    }
    setUser(userId: string, key: string, data: any) {
      this.userCache.set(`${userId}:${key}`, { data, timestamp: new Date() })
    }
    invalidateUser(userId: string) {}
    invalidateGlobal() {
      this.globalCache.clear()
    }
  },
}))

import { GET } from '@/app/api/badge-counts/route'
import { getAuthSession } from '@/lib/auth/helpers'

describe('GET /api/badge-counts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'user-1', role: 'STAFF' } })
    prismaMock.user.count.mockResolvedValue(0)
    prismaMock.enrollment.count.mockResolvedValue(0)
    prismaMock.payment.count.mockResolvedValue(0)
    prismaMock.message.count.mockResolvedValue(0)
    prismaMock.notification.count.mockResolvedValue(0)
  })

  it('returns zero counts for staff', async () => {
    const req = new NextRequest('http://localhost/api/badge-counts')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.pendingApplicants).toBe(0)
    expect(json.pendingPayments).toBe(0)
    expect(json.unreadMessages).toBe(0)
  })

  it('returns 401 when not authenticated', async () => {
    ;(getAuthSession as any).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/badge-counts')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })
})
