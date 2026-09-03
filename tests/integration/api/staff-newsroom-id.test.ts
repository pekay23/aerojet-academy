import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/auth-options', () => ({
  getAuthSession: vi.fn(),
}))

vi.mock('@/lib/api/response', () => ({
  apiSuccess: vi.fn((data: any) => ({ status: 200, json: () => Promise.resolve(data) })),
  apiError: vi.fn((message: any, status?: number) => ({ status: status || 400, json: () => Promise.resolve({ message, error: message }) })),
}))

import { GET } from '@/app/api/staff/newsroom/[id]/route'
import { PATCH } from '@/app/api/staff/newsroom/[id]/route'
import { DELETE } from '@/app/api/staff/newsroom/[id]/route'
import { getAuthSession } from '@/lib/auth/auth-options'

const ctxFor = (id: string) => ({ params: Promise.resolve({ id }) })

const makeArticle = (overrides: Record<string, any> = {}) => ({
  id: 'article-1',
  title: 'Original Title',
  slug: 'original-slug',
  excerpt: 'excerpt',
  content: 'content',
  coverImage: null,
  status: 'DRAFT',
  customAuthorName: null,
  publishedAt: new Date('2024-01-01T00:00:00.000Z'),
  customPublishedAt: null,
  tags: ['a'],
  ...overrides,
})

describe('GET/PATCH/DELETE /api/staff/newsroom/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
    ;(getAuthSession as any).mockResolvedValue({ user: { id: 'staff-1', role: 'ADMIN' } })
  })

  describe('GET', () => {
    it('returns the article when found', async () => {
      const article = makeArticle()
      prismaMock.newsArticle.findUnique.mockResolvedValueOnce(article as any)
      const req = new NextRequest('http://localhost/api/staff/newsroom/article-1')
      const res = await GET(req, ctxFor('article-1'))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toEqual(article)
    })

    it('returns 404 when not found', async () => {
      prismaMock.newsArticle.findUnique.mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/staff/newsroom/missing')
      const res = await GET(req, ctxFor('missing'))
      expect(res.status).toBe(404)
      const json = await res.json()
      expect(json.error).toBe('Not found')
    })
  })

  describe('PATCH', () => {
    it('returns 401 when unauthenticated', async () => {
      ;(getAuthSession as any).mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/staff/newsroom/article-1', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Updated' }),
      })
      const res = await PATCH(req, ctxFor('article-1'))
      expect(res.status).toBe(401)
    })

    it('returns 401 when role is not staff/admin', async () => {
      ;(getAuthSession as any).mockResolvedValueOnce({ user: { id: 'u-1', role: 'STUDENT' } })
      const req = new NextRequest('http://localhost/api/staff/newsroom/article-1', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Updated' }),
      })
      const res = await PATCH(req, ctxFor('article-1'))
      expect(res.status).toBe(401)
    })

    it('returns 404 when article not found', async () => {
      prismaMock.newsArticle.findUnique.mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/staff/newsroom/article-1', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Updated' }),
      })
      const res = await PATCH(req, ctxFor('article-1'))
      expect(res.status).toBe(404)
    })

    it('returns 400 when slug already in use', async () => {
      prismaMock.newsArticle.findUnique
        .mockResolvedValueOnce(makeArticle({ slug: 'original-slug' }) as any)
        .mockResolvedValueOnce(makeArticle({ id: 'other', slug: 'taken-slug' }) as any)
      const req = new NextRequest('http://localhost/api/staff/newsroom/article-1', {
        method: 'PATCH',
        body: JSON.stringify({ slug: 'taken-slug' }),
      })
      const res = await PATCH(req, ctxFor('article-1'))
      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Slug already in use')
    })

    it('updates and returns the article', async () => {
      const current = makeArticle()
      const updated = makeArticle({ title: 'Updated Title', status: 'PUBLISHED' })
      prismaMock.newsArticle.findUnique
        .mockResolvedValueOnce(current as any)
        .mockResolvedValueOnce(null)
      prismaMock.newsArticle.update.mockResolvedValueOnce(updated as any)
      const req = new NextRequest('http://localhost/api/staff/newsroom/article-1', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Updated Title', status: 'PUBLISHED' }),
      })
      const res = await PATCH(req, ctxFor('article-1'))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.title).toBe('Updated Title')
      expect(prismaMock.newsArticle.update).toHaveBeenCalledTimes(1)
    })
  })

  describe('DELETE', () => {
    it('returns 401 when unauthenticated', async () => {
      ;(getAuthSession as any).mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/staff/newsroom/article-1', {
        method: 'DELETE',
      })
      const res = await DELETE(req, ctxFor('article-1'))
      expect(res.status).toBe(401)
    })

    it('deletes and returns success', async () => {
      prismaMock.newsArticle.delete.mockResolvedValueOnce({} as any)
      const req = new NextRequest('http://localhost/api/staff/newsroom/article-1', {
        method: 'DELETE',
      })
      const res = await DELETE(req, ctxFor('article-1'))
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(prismaMock.newsArticle.delete).toHaveBeenCalledWith({ where: { id: 'article-1' } })
    })
  })
})
