import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCurrentUser } from '@/hooks/use-current-user'

describe('hooks/use-current-user', () => {
  it('exports useCurrentUser', async () => {
    const mod = await import('@/hooks/use-current-user')
    expect(mod.useCurrentUser).toBeDefined()
  })

  it('returns an object', () => {
    const { result } = renderHook(() => useCurrentUser())
    expect(typeof result.current).toBe('object')
  })
})
