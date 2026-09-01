import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useBadgeCounts } from '@/hooks/useBadgeCounts'

describe('hooks/useBadgeCounts', () => {
  it('exports useBadgeCounts', async () => {
    const mod = await import('@/hooks/useBadgeCounts')
    expect(mod.useBadgeCounts).toBeDefined()
  })

  it('returns an object', () => {
    const { result } = renderHook(() => useBadgeCounts())
    expect(typeof result.current).toBe('object')
  })
})
