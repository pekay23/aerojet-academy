import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBadgeCounts } from '@/hooks/useBadgeCounts'

describe('hooks/useBadgeCounts', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('exports useBadgeCounts', async () => {
    const mod = await import('@/hooks/useBadgeCounts')
    expect(mod.useBadgeCounts).toBeDefined()
  })

  it('returns an object with counts and refresh', () => {
    const { result } = renderHook(() => useBadgeCounts())
    expect(typeof result.current).toBe('object')
    expect(result.current).toHaveProperty('counts')
    expect(result.current).toHaveProperty('refresh')
  })

  it('initializes with default zero counts', () => {
    const { result } = renderHook(() => useBadgeCounts())
    expect(result.current.counts).toEqual({
      notifications: 0,
      messages: 0,
      applicants: undefined,
      enrollments: undefined,
      payments: undefined,
      pendingGrading: undefined,
    })
  })

  it('initializes with provided initial counts', () => {
    const { result } = renderHook(() =>
      useBadgeCounts({ notifications: 5, messages: 3, applicants: 2 })
    )
    expect(result.current.counts).toEqual({
      notifications: 5,
      messages: 3,
      applicants: 2,
      enrollments: undefined,
      payments: undefined,
      pendingGrading: undefined,
    })
  })

  it('fetches counts on mount', async () => {
    const mockResponse = {
      notifications: 2,
      messages: 1,
      applicants: 5,
      enrollments: 3,
      payments: 2,
      pendingGrading: 4,
    }
    ;(global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const { result } = renderHook(() => useBadgeCounts())

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(global.fetch).toHaveBeenCalledWith('/api/badge-counts')
    expect(result.current.counts).toEqual(mockResponse)
  })

  it('handles fetch errors gracefully', async () => {
    ;(global.fetch as Mock).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useBadgeCounts({ notifications: 1 }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
      await Promise.resolve()
    })

    // Should keep initial counts on error
    expect(result.current.counts.notifications).toBe(1)
  })

  it('ignores malformed response (missing required fields)', async () => {
    const mockResponse = { notifications: 5 } // missing messages
    ;(global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const { result } = renderHook(() => useBadgeCounts({ notifications: 1, messages: 2 }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
      await Promise.resolve()
    })

    // Should keep initial counts, not overwrite with malformed data
    expect(result.current.counts.notifications).toBe(1)
    expect(result.current.counts.messages).toBe(2)
  })

  it('ignores malformed response (non-finite numbers)', async () => {
    const mockResponse = { notifications: NaN, messages: Infinity }
    ;(global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const { result } = renderHook(() => useBadgeCounts({ notifications: 3, messages: 4 }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
      await Promise.resolve()
    })

    // Should keep initial counts
    expect(result.current.counts.notifications).toBe(3)
    expect(result.current.counts.messages).toBe(4)
  })

  it('ignores error-shaped successful response (contains error field)', async () => {
    const mockResponse = { notifications: 0, messages: 0, error: 'Partial failure' }
    ;(global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const { result } = renderHook(() => useBadgeCounts({ notifications: 7, messages: 8 }))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
      await Promise.resolve()
    })

    // Should keep initial counts, not treat error field as valid zero counts
    expect(result.current.counts.notifications).toBe(7)
    expect(result.current.counts.messages).toBe(8)
  })

  it('accepts valid response with optional fields', async () => {
    const mockResponse = {
      notifications: 10,
      messages: 5,
      applicants: 3,
      enrollments: 2,
      payments: 1,
      pendingGrading: 4,
    }
    ;(global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const { result } = renderHook(() => useBadgeCounts())

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
      await Promise.resolve()
    })

    expect(result.current.counts).toEqual(mockResponse)
  })

  it('refresh function triggers fetch', async () => {
    const mockResponse = { notifications: 3, messages: 2 }
    ;(global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const { result } = renderHook(() => useBadgeCounts())

    await act(async () => {
      result.current.refresh()
      await vi.advanceTimersByTimeAsync(0)
      await Promise.resolve()
    })

    expect(global.fetch).toHaveBeenCalledTimes(2) // mount + refresh
  })

  it('polls at specified interval', async () => {
    ;(global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ notifications: 1, messages: 1 }),
    })

    renderHook(() => useBadgeCounts(undefined, 5000))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
      await Promise.resolve()
    })

    expect(global.fetch).toHaveBeenCalledTimes(1)

    await act(async () => {
      vi.advanceTimersByTime(5000)
      await vi.advanceTimersByTimeAsync(0)
      await Promise.resolve()
    })

    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('cleans up interval on unmount', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
    ;(global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ notifications: 0, messages: 0 }),
    })

    const { unmount } = renderHook(() => useBadgeCounts())
    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
  })
})
