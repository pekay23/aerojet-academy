import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

import { GET } from '@/app/api/search/route'

describe('GET /api/search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn: any) => fn(prismaMock))
  })

  describe('GET', () => {
    it('returns results when query is provided', async () => {
      prismaMock.course.findMany.mockResolvedValueOnce([
        { id: '1', code: 'MOD1', name: 'Module 1', description: 'Test' },
      ] as any)
      const req = new NextRequest('http://localhost/api/search?q=module', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
      expect(json.results).toBeDefined()
    })

    it('returns empty results when query is too short', async () => {
      const req = new NextRequest('http://localhost/api/search?q=a', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
      expect(json.results).toEqual([])
    })

    it('returns empty results when no query provided', async () => {
      const req = new NextRequest('http://localhost/api/search', {
        headers: { Authorization: 'Bearer test-secret' },
      })
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toBeDefined()
      expect(json.results).toEqual([])
    })
  })
})
