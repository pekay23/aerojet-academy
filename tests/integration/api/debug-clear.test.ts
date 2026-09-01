import { describe, it, expect, vi } from 'vitest'

describe('clearAllMocks behavior', () => {
  it('should preserve mockReturnValue after clearAllMocks', () => {
    const mockFn = vi.fn().mockReturnValue(42)
    expect(mockFn()).toBe(42)
    vi.clearAllMocks()
    expect(mockFn()).toBe(42)
  })
})
