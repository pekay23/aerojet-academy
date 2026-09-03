import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/auth-options'

vi.mock('@/lib/auth/auth-options', () => ({
  getAuthSession: vi.fn(),
  authOptions: {},
}))

vi.mock('@/lib/api/response', () => ({
  apiSuccess: vi.fn((data: any) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiError: vi.fn((message: any, status?: number) => ({ status: status || 400, json: () => Promise.resolve({ message, error: message }) })),
  apiPaginated: vi.fn((data) => ({ status: 200, json: () => Promise.resolve(data) })),
  parsePagination: vi.fn().mockReturnValue({ page: 1, limit: 20, skip: 0 }),
}))

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn: any) => fn),
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}))

import { GET } from '@/app/api/staff/newsroom/route'
import { POST } from '@/app/api/staff/newsroom/route'

const staffSession = { user: { id: 'staff-1', role: 'STAFF' } }

describe('GET/POST /api/staff/newsroom', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
    ;(getAuthSession as any).mockResolvedValue(staffSession)
  })

  describe('GET', () => {
    it('returns paginated list', async () => {
      prismaMock.newsArticle.findMany.mockResolvedValueOnce([{ id: '1' }] as any)
      prismaMock.newsArticle.count.mockResolvedValueOnce(1)
      const req = new NextRequest('http://localhost/api/staff/newsroom?page=1&limit=20')
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })

    it('returns empty list when no data', async () => {
      prismaMock.newsArticle.findMany.mockResolvedValueOnce([])
      prismaMock.newsArticle.count.mockResolvedValueOnce(0)
      const req = new NextRequest('http://localhost/api/staff/newsroom')
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
    })
  })

  describe('POST', () => {
    it('returns 401 when unauthenticated', async () => {
      ;(getAuthSession as any).mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/staff/newsroom', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })
  })
})
