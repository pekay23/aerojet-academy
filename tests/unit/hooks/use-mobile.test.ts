import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMobile } from '@/hooks/use-mobile'

describe('hooks/use-mobile', () => {
  it('exports useMobile', async () => {
    const mod = await import('@/hooks/use-mobile')
    expect(mod.useMobile).toBeDefined()
  })

  it('returns a boolean', () => {
    const { result } = renderHook(() => useMobile())
    expect(typeof result.current).toBe('boolean')
  })
})
