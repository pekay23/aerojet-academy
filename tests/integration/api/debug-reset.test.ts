import { describe, it, expect, vi } from 'vitest'

describe('resetAllMocks behavior', () => {
  it('should preserve mockReturnValue after resetAllMocks', () => {
    const mockFn = vi.fn().mockReturnValue(42)
    expect(mockFn()).toBe(42)
    vi.resetAllMocks()
    expect(mockFn()).toBe(42)
  })

  it('should preserve module mock returnValue after resetAllMocks', async () => {
    vi.mock('@/lib/security/rate-limit', () => ({
      rateLimit: vi.fn().mockReturnValue({ allowed: true }),
    }))

    const { rateLimit } = await import('@/lib/security/rate-limit')
    expect(rateLimit('key')).toEqual({ allowed: true })
    vi.resetAllMocks()
    expect(rateLimit('key')).toEqual({ allowed: true })
  })
})
