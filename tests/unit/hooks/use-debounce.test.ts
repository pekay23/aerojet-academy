import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDebounce } from '@/hooks/use-debounce'

describe('hooks/use-debounce', () => {
  it('exports useDebounce', async () => {
    const mod = await import('@/hooks/use-debounce')
    expect(mod.useDebounce).toBeDefined()
  })

  it('returns a value', () => {
    const { result } = renderHook(() => useDebounce('test', 300))
    expect(result.current).toBe('test')
  })
})
