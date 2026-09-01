import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useToast } from '@/hooks/use-toast'

describe('hooks/use-toast', () => {
  it('exports useToast', async () => {
    const mod = await import('@/hooks/use-toast')
    expect(mod.useToast).toBeDefined()
  })

  it('returns an object', () => {
    const { result } = renderHook(() => useToast())
    expect(typeof result.current).toBe('object')
  })
})
