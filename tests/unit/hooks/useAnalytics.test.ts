import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAnalytics } from '@/hooks/useAnalytics'

describe('hooks/useAnalytics', () => {
  it('exports useAnalytics', async () => {
    const mod = await import('@/hooks/useAnalytics')
    expect(mod.useAnalytics).toBeDefined()
  })

  it('can be called without error', () => {
    const { result } = renderHook(() => useAnalytics())
    expect((result as any).error).toBeUndefined()
  })
})
