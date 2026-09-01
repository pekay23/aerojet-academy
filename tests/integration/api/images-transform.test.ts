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

vi.mock('sharp', () => ({
  default: vi.fn().mockReturnValue({
    withMetadata: vi.fn().mockReturnThis(),
    resize: vi.fn().mockReturnThis(),
    composite: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    avif: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('image-data')),
  }),
}))

import { GET } from '@/app/api/images/transform/route.ts'

describe('GET /api/images/transform', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn) => fn(prismaMock))
    ;(getServerSession as any).mockResolvedValue({ user: { id: 'user-1', role: 'ADMIN' } })
  })

  describe('GET', () => {
    it('returns 400 when url parameter is missing', async () => {
      const req = new NextRequest('http://localhost/api/images/transform', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(400)
    })

    it('returns 401 when unauthenticated', async () => {
      ;(getServerSession as any).mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/images/transform?url=https://example.com/image.png', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(401)
    })

    it('returns 403 when user is not staff', async () => {
      ;(getServerSession as any).mockResolvedValueOnce({ user: { id: 'user-1', role: 'STUDENT' } })
      const req = new NextRequest('http://localhost/api/images/transform?url=https://example.com/image.png', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(403)
    })

    it('allows SUPER_ADMIN to transform images', async () => {
      ;(getServerSession as any).mockResolvedValueOnce({ user: { id: 'user-1', role: 'SUPER_ADMIN' } })
      const req = new NextRequest('http://localhost/api/images/transform?url=https://example.com/image.png', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
    })

    it('allows ADMIN to transform images', async () => {
      ;(getServerSession as any).mockResolvedValueOnce({ user: { id: 'user-1', role: 'ADMIN' } })
      const req = new NextRequest('http://localhost/api/images/transform?url=https://example.com/image.png', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
    })

    it('allows STAFF to transform images', async () => {
      ;(getServerSession as any).mockResolvedValueOnce({ user: { id: 'user-1', role: 'STAFF' } })
      const req = new NextRequest('http://localhost/api/images/transform?url=https://example.com/image.png', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
    })

    it('allows INSTRUCTOR to transform images', async () => {
      ;(getServerSession as any).mockResolvedValueOnce({ user: { id: 'user-1', role: 'INSTRUCTOR' } })
      const req = new NextRequest('http://localhost/api/images/transform?url=https://example.com/image.png', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
    })

    it('allows EXAMINER to transform images', async () => {
      ;(getServerSession as any).mockResolvedValueOnce({ user: { id: 'user-1', role: 'EXAMINER' } })
      const req = new NextRequest('http://localhost/api/images/transform?url=https://example.com/image.png', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
    })

    it('returns 403 when applicant tries to transform images', async () => {
      ;(getServerSession as any).mockResolvedValueOnce({ user: { id: 'user-1', role: 'APPLICANT' } })
      const req = new NextRequest('http://localhost/api/images/transform?url=https://example.com/image.png', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(403)
    })

    it('returns 404 when image fetch fails', async () => {
      ;(getServerSession as any).mockResolvedValueOnce({ user: { id: 'user-1', role: 'ADMIN' } })
      const { getStorageAdapter } = await import('@/lib/storage/proxy')
      ;(getStorageAdapter as any).mockReturnValueOnce({
        name: 'http',
        fetch: vi.fn().mockRejectedValue(new Error('Not found')),
      })
      const req = new NextRequest('http://localhost/api/images/transform?url=https://example.com/image.png', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(404)
    })

    it('returns 200 with transformed image when staff', async () => {
      const req = new NextRequest('http://localhost/api/images/transform?url=https://example.com/image.png', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
    })
  })
})
