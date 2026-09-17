import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'

describe('hooks/useUnsavedChanges', () => {
  it('exports useUnsavedChanges', async () => {
    const mod = await import('@/hooks/useUnsavedChanges')
    expect(mod.useUnsavedChanges).toBeDefined()
  })

  it('returns an object', () => {
    const { result } = renderHook(() => useUnsavedChanges())
    expect(typeof result.current).toBe('object')
  })
})
