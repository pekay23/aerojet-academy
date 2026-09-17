import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCurrentRole } from '@/hooks/use-current-role'

describe('hooks/use-current-role', () => {
  it('exports useCurrentRole', async () => {
    const mod = await import('@/hooks/use-current-role')
    expect(mod.useCurrentRole).toBeDefined()
  })

  it('returns an object', () => {
    const { result } = renderHook(() => useCurrentRole())
    expect(typeof result.current).toBe('object')
  })
})
