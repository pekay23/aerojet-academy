import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('lib/security/rate-limit', () => {
  let rateLimit: any
  let rateLimitByIP: any
  let rateLimitByUser: any
  let rateLimitAuth: any
  let clearRateLimit: any
  let getRateLimitInfo: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await vi.importActual('@/lib/security/rate-limit')
    rateLimit = mod.rateLimit
    rateLimitByIP = mod.rateLimitByIP
    rateLimitByUser = mod.rateLimitByUser
    rateLimitAuth = mod.rateLimitAuth
    clearRateLimit = mod.clearRateLimit
    getRateLimitInfo = mod.getRateLimitInfo
  })

  describe('rateLimit', () => {
    it('allows request under limit', () => {
      const result = rateLimit('test-key', 3, 60000)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(2)
      expect(result.resetAt).toBeGreaterThan(Date.now())
    })

    it('blocks request after limit reached', () => {
      const key = 'rate-limit-block-test'
      clearRateLimit(key)

      rateLimit(key, 2, 60000)
      rateLimit(key, 2, 60000)

      const result = rateLimit(key, 2, 60000)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('resets after window expires', () => {
      const key = 'rate-limit-reset-test'
      clearRateLimit(key)

      rateLimit(key, 1, 100)
      const blocked = rateLimit(key, 1, 100)
      expect(blocked.allowed).toBe(false)

      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 200)
      const result = rateLimit(key, 1, 100)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(0)

      vi.restoreAllMocks()
    })

    it('uses default limit of 10 and window of 60000ms', () => {
      const key = 'rate-limit-defaults-test'
      clearRateLimit(key)

      const result = rateLimit(key)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(9)
    })

    it('returns correct remaining count at each step', () => {
      const key = 'in-memory-remaining-test'
      clearRateLimit(key)

      expect(rateLimit(key, 5, 60000).remaining).toBe(4)
      expect(rateLimit(key, 5, 60000).remaining).toBe(3)
      expect(rateLimit(key, 5, 60000).remaining).toBe(2)
      expect(rateLimit(key, 5, 60000).remaining).toBe(1)
      expect(rateLimit(key, 5, 60000).remaining).toBe(0)
    })

    it('blocks on second call when limit is zero', () => {
      const key = 'in-memory-zero-test'
      clearRateLimit(key)

      const first = rateLimit(key, 0, 60000)
      expect(first.allowed).toBe(true)
      expect(first.remaining).toBe(-1)

      const second = rateLimit(key, 0, 60000)
      expect(second.allowed).toBe(false)
      expect(second.remaining).toBe(0)
    })
  })

  describe('rateLimitByIP', () => {
    it('uses ip: prefix for key', () => {
      const result = rateLimitByIP('192.168.1.1', 5, 60000)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
    })

    it('blocks after threshold', () => {
      const key = 'ip:192.168.1.2'
      clearRateLimit(key)

      rateLimitByIP('192.168.1.2', 2, 60000)
      rateLimitByIP('192.168.1.2', 2, 60000)

      const result = rateLimitByIP('192.168.1.2', 2, 60000)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })
  })

  describe('rateLimitByUser', () => {
    it('uses user: prefix for key', () => {
      const result = rateLimitByUser('user-123', 10, 60000)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(9)
    })

    it('blocks after threshold', () => {
      const key = 'user:user-456'
      clearRateLimit(key)

      rateLimitByUser('user-456', 2, 60000)
      rateLimitByUser('user-456', 2, 60000)

      const result = rateLimitByUser('user-456', 2, 60000)
      expect(result.allowed).toBe(false)
    })
  })

  describe('rateLimitAuth', () => {
    it('applies correct config for login', () => {
      const result = rateLimitAuth('login')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
    })

    it('applies correct config for register', () => {
      const result = rateLimitAuth('register')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(2)
    })

    it('applies correct config for forgotPassword', () => {
      const result = rateLimitAuth('forgotPassword')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(2)
    })

    it('applies correct config for resetPassword', () => {
      const result = rateLimitAuth('resetPassword')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
    })

    it('applies correct config for api', () => {
      const result = rateLimitAuth('api')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(99)
    })
  })

  describe('clearRateLimit', () => {
    it('removes a rate limit entry', () => {
      const key = 'clear-test-key'
      rateLimit(key, 1, 60000)
      expect(rateLimit(key, 1, 60000).allowed).toBe(false)

      clearRateLimit(key)

      const result = rateLimit(key, 1, 60000)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(0)
    })
  })

  describe('getRateLimitInfo', () => {
    it('returns null for non-existent key', () => {
      expect(getRateLimitInfo('non-existent')).toBeNull()
    })

    it('returns info for existing key', () => {
      const key = 'info-test-key'
      clearRateLimit(key)
      rateLimit(key, 5, 60000)

      const info = getRateLimitInfo(key)
      expect(info).not.toBeNull()
      expect(info?.count).toBe(1)
      expect(info?.resetAt).toBeGreaterThan(Date.now())
    })

    it('returns null after window expires', () => {
      const key = 'info-expired-test'
      clearRateLimit(key)
      rateLimit(key, 1, 100)

      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 200)
      expect(getRateLimitInfo(key)).toBeNull()
      vi.restoreAllMocks()
    })
  })
})
