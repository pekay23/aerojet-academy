import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useConfirmDialog } from '@/hooks/use-confirm-dialog'

describe('hooks/use-confirm-dialog', () => {
  it('exports useConfirmDialog', async () => {
    const mod = await import('@/hooks/use-confirm-dialog')
    expect(mod.useConfirmDialog).toBeDefined()
  })

  it('returns an object', () => {
    const { result } = renderHook(() => useConfirmDialog())
    expect(typeof result.current).toBe('object')
  })
})
