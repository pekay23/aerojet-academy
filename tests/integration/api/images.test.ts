import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireAuth: vi.fn(),
  requireInstructor: vi.fn(),
  verifyPassword: vi.fn().mockResolvedValue(true),
  hashPassword: vi.fn().mockResolvedValue('$hashed$'),
  generateToken: vi.fn().mockReturnValue('verify-token'),
  generateTempPassword: vi.fn().mockReturnValue('TempPass1!'),
  generateAcademyEmail: vi.fn().mockResolvedValue('j.doe@aerojet-academy.com'),
}))

vi.mock('@/lib/auth/auth-options', () => ({
  authOptions: {},
}))

vi.mock('@/lib/storage/proxy', () => ({
  getStorageAdapter: vi.fn(),
}))

vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    avif: vi.fn().mockReturnThis(),
    withMetadata: vi.fn().mockReturnThis(),
    composite: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('fake-image')),
  })),
}))

import { getServerSession } from 'next-auth'
import { GET as GetProxy } from '@/app/api/images/proxy/route'
import { GET as GetTransform } from '@/app/api/images/transform/route'
import { requireAuth } from '@/lib/auth/helpers'
import { getStorageAdapter } from '@/lib/storage/proxy'

const mockUser = { id: 'user-1', role: 'STAFF', email: 'staff@test.com' }

const mockAdapterFetch = async (): Promise<{ data: ArrayBuffer; contentType: string }> => ({
  data: new ArrayBuffer(8),
  contentType: 'image/webp',
})

describe('Images Proxy — GET /api/images/proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue({ user: mockUser })
    ;(getStorageAdapter as any).mockReturnValue({ fetch: vi.fn().mockResolvedValue(mockAdapterFetch()) })
  })

  it('returns 400 when url parameter is missing', async () => {
    const req = new NextRequest('http://localhost/api/images/proxy', { method: 'GET' })
    const res = await GetProxy(req)
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.error).toBe('Missing url parameter')
  })

  it('returns 401 when not authenticated', async () => {
    ;(getServerSession as any).mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/images/proxy?url=https://utfs.io/a/b/c', { method: 'GET' })
    const res = await GetProxy(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 for students scope with non-student role', async () => {
    ;(getServerSession as any).mockResolvedValueOnce({ user: { ...mockUser, role: 'STUDENT' } })
    const req = new NextRequest('http://localhost/api/images/proxy?url=https://utfs.io/a/students/other/doc.jpg&scope=students', { method: 'GET' })
    const res = await GetProxy(req)
    expect(res.status).toBe(403)
  })

  it('returns 403 for resources scope with student role', async () => {
    ;(getServerSession as any).mockResolvedValueOnce({ user: { ...mockUser, role: 'STUDENT' } })
    const req = new NextRequest('http://localhost/api/images/proxy?url=https://utfs.io/a/resources/doc.pdf&scope=resources', { method: 'GET' })
    const res = await GetProxy(req)
    expect(res.status).toBe(403)
  })

  it('returns 200 for staff accessing students scope', async () => {
    const adapter = { fetch: vi.fn().mockResolvedValue(mockAdapterFetch()) }
    ;(getStorageAdapter as any).mockReturnValue(adapter)

    const req = new NextRequest('http://localhost/api/images/proxy?url=https://utfs.io/a/students/user-1/doc.jpg&scope=students', { method: 'GET' })
    const res = await GetProxy(req)
    expect(res.status).toBe(200)

    expect(adapter.fetch).toHaveBeenCalledWith('https://utfs.io/a/students/user-1/doc.jpg')
  })

  it('returns 400 for invalid image URL', async () => {
    const req = new NextRequest('http://localhost/api/images/proxy?url=not-a-url', { method: 'GET' })
    const res = await GetProxy(req)
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.error).toBe('Invalid image URL')
  })

  it('returns 403 for disallowed host', async () => {
    const req = new NextRequest('http://localhost/api/images/proxy?url=https://evil.com/img.jpg', { method: 'GET' })
    const res = await GetProxy(req)
    expect(res.status).toBe(403)

    const json = await res.json()
    expect(json.error).toBe('Image source not allowed')
  })

  it('returns 200 for profile-photos scope (any authenticated user)', async () => {
    const adapter = { fetch: vi.fn().mockResolvedValue(mockAdapterFetch()) }
    ;(getStorageAdapter as any).mockReturnValue(adapter)

    const req = new NextRequest('http://localhost/api/images/proxy?url=https://utfs.io/a/profile/user-1.jpg&scope=profile-photos', { method: 'GET' })
    const res = await GetProxy(req)
    expect(res.status).toBe(200)
  })
})

describe('Images Transform — GET /api/images/transform', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue({ user: mockUser })
    ;(getStorageAdapter as any).mockReturnValue({ fetch: vi.fn().mockResolvedValue(mockAdapterFetch()) })
  })

  it('returns 400 when url parameter is missing', async () => {
    const req = new NextRequest('http://localhost/api/images/transform', { method: 'GET' })
    const res = await GetTransform(req)
    expect(res.status).toBe(400)

    const json = await res.json()
    expect(json.error).toBe('Missing url parameter')
  })

  it('returns 401 when not authenticated', async () => {
    ;(getServerSession as any).mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/images/transform?url=https://utfs.io/a/b/c', { method: 'GET' })
    const res = await GetTransform(req)
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-staff role', async () => {
    ;(getServerSession as any).mockResolvedValueOnce({ user: { ...mockUser, role: 'STUDENT' } })
    const req = new NextRequest('http://localhost/api/images/transform?url=https://utfs.io/a/b/c', { method: 'GET' })
    const res = await GetTransform(req)
    expect(res.status).toBe(403)
  })

  it('allows staff and examiner roles', async () => {
    const adapter = { fetch: vi.fn().mockResolvedValue(mockAdapterFetch()) }
    ;(getStorageAdapter as any).mockReturnValue(adapter)

    for (const role of ['SUPER_ADMIN', 'ADMIN', 'STAFF', 'INSTRUCTOR', 'EXAMINER']) {
      ;(getServerSession as any).mockResolvedValueOnce({ user: { ...mockUser, role } })
      const req = new NextRequest('http://localhost/api/images/transform?url=https://utfs.io/a/b/c', { method: 'GET' })
      const res = await GetTransform(req)
      expect(res.status).toBe(200)
    }
  })

  it('returns 404 when adapter fetch fails', async () => {
    ;(getStorageAdapter as any).mockReturnValue({
      fetch: vi.fn().mockRejectedValueOnce(new Error('Not found')),
    })

    const req = new NextRequest('http://localhost/api/images/transform?url=https://utfs.io/a/missing.jpg', { method: 'GET' })
    const res = await GetTransform(req)
    expect(res.status).toBe(404)

    const json = await res.json()
    expect(json.error).toBe('Image not found')
  })

  it('returns transformed image with correct headers on success', async () => {
    const adapter = { fetch: vi.fn().mockResolvedValue(mockAdapterFetch()) }
    ;(getStorageAdapter as any).mockReturnValue(adapter)

    const req = new NextRequest('http://localhost/api/images/transform?url=https://utfs.io/a/b/c&w=400&watermark=true&strip=true&q=90&format=jpeg', { method: 'GET' })
    const res = await GetTransform(req)
    expect(res.status).toBe(200)

    expect(res.headers.get('content-type')).toBe('image/jpeg')
    expect(res.headers.get('x-image-transformed')).toBe('true')
  })
})
