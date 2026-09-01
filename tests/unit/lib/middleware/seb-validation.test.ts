import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isSEBRequest } from '@/lib/middleware/seb-detection'

vi.mock('@/lib/constants/business-rules', () => ({
  SEB: {
    BROWSER_EXAM_KEY: 'test-bek-key-12345',
    ALLOWED_ORIGINS: ['https://safeexambrowser.org'],
  },
}))

describe('lib/middleware/seb-detection', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('isSEBRequest', () => {
    it('returns true for valid SEB request with matching hash', () => {
      const req = new Request('http://localhost/exam', {
        headers: { 'x-safeexambrowser-requesthash': 'test-bek-key-12345' },
      })
      expect(isSEBRequest(req)).toBe(true)
    })

    it('returns false when header is missing', () => {
      const req = new Request('http://localhost/exam')
      expect(isSEBRequest(req)).toBe(false)
    })

    it('returns false when header does not match BEK', () => {
      const req = new Request('http://localhost/exam', {
        headers: { 'x-safeexambrowser-requesthash': 'wrong-key' },
      })
      expect(isSEBRequest(req)).toBe(false)
    })

    it('returns false when BROWSER_EXAM_KEY is empty', async () => {
      vi.doMock('@/lib/constants/business-rules', () => ({
        SEB: {
          BROWSER_EXAM_KEY: '',
          ALLOWED_ORIGINS: ['https://safeexambrowser.org'],
        },
      }))

      const { isSEBRequest: isSEBRequestReloaded } = await import('@/lib/middleware/seb-detection')
      const req = new Request('http://localhost/exam', {
        headers: { 'x-safeexambrowser-requesthash': 'any-key' },
      })
      expect(isSEBRequestReloaded(req)).toBe(false)
    })

    it('returns false for empty header value', () => {
      const req = new Request('http://localhost/exam', {
        headers: { 'x-safeexambrowser-requesthash': '' },
      })
      expect(isSEBRequest(req)).toBe(false)
    })
  })
})
