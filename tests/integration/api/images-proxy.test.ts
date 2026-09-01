import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'

vi.mock('@/lib/auth/auth-options', () => ({
  authOptions: {},
}))

vi.mock('@/lib/storage/proxy', () => ({
  getStorageAdapter: vi.fn().mockReturnValue({
    name: 'http',
    fetch: vi.fn().mockResolvedValue({
      data: new ArrayBuffer(8),
      contentType: 'image/png',
    }),
  }),
}))

import { GET } from '@/app/api/images/proxy/route.ts'

describe('GET /api/images/proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn) => fn(prismaMock))
    ;(getServerSession as any).mockResolvedValue({ user: { id: 'user-1', role: 'STUDENT' } })
  })

  describe('GET', () => {
    it('returns 400 when url parameter is missing', async () => {
      const req = new NextRequest('http://localhost/api/images/proxy', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(400)
    })

    it('returns 401 when unauthenticated', async () => {
      ;(getServerSession as any).mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/images/proxy?url=https://example.com/image.png', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(401)
    })

    it('returns 200 with image data when authenticated', async () => {
      const req = new NextRequest('http://localhost/api/images/proxy?url=https://example.com/image.png', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
    })

    it('returns 403 when student tries to access staff scope', async () => {
      ;(getServerSession as any).mockResolvedValueOnce({ user: { id: 'user-1', role: 'STUDENT' } })
      const req = new NextRequest('http://localhost/api/images/proxy?url=https://example.com/image.png&scope=staff', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(403)
    })

    it('allows student to access their own student-scoped image', async () => {
      ;(getServerSession as any).mockResolvedValueOnce({ user: { id: 'user-1', role: 'STUDENT' } })
      const req = new NextRequest('http://localhost/api/images/proxy?url=https://example.com/students/user-1/image.png&scope=students', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
    })

    it('returns 403 when student tries to access another student image', async () => {
      ;(getServerSession as any).mockResolvedValueOnce({ user: { id: 'user-1', role: 'STUDENT' } })
      const req = new NextRequest('http://localhost/api/images/proxy?url=https://example.com/students/user-2/image.png&scope=students', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(403)
    })

    it('returns 403 when student tries to access resources scope', async () => {
      ;(getServerSession as any).mockResolvedValueOnce({ user: { id: 'user-1', role: 'STUDENT' } })
      const req = new NextRequest('http://localhost/api/images/proxy?url=https://example.com/image.png&scope=resources', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(403)
    })

    it('allows staff to access staff scope', async () => {
      ;(getServerSession as any).mockResolvedValueOnce({ user: { id: 'user-1', role: 'STAFF' } })
      const req = new NextRequest('http://localhost/api/images/proxy?url=https://example.com/image.png&scope=staff', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
    })

    it('allows any authenticated user to access profile-photos scope', async () => {
      ;(getServerSession as any).mockResolvedValueOnce({ user: { id: 'user-1', role: 'STUDENT' } })
      const req = new NextRequest('http://localhost/api/images/proxy?url=https://example.com/image.png&scope=profile-photos', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
    })

    it('returns 400 for invalid scope', async () => {
      ;(getServerSession as any).mockResolvedValueOnce({ user: { id: 'user-1', role: 'ADMIN' } })
      const req = new NextRequest('http://localhost/api/images/proxy?url=https://example.com/image.png&scope=invalid', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(400)
    })

    it('returns 404 when image fetch fails', async () => {
      ;(getServerSession as any).mockResolvedValueOnce({ user: { id: 'user-1', role: 'STUDENT' } })
      const { getStorageAdapter } = await import('@/lib/storage/proxy')
      ;(getStorageAdapter as any).mockReturnValueOnce({
        name: 'http',
        fetch: vi.fn().mockRejectedValue(new Error('Not found')),
      })
      const req = new NextRequest('http://localhost/api/images/proxy?url=https://example.com/image.png', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(404)
    })
  })
})
