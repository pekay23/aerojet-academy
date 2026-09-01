import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTableSort } from '@/hooks/use-table-sort'

describe('hooks/use-table-sort', () => {
  it('exports useTableSort', async () => {
    const mod = await import('@/hooks/use-table-sort')
    expect(mod.useTableSort).toBeDefined()
  })

  it('returns an object', () => {
    const { result } = renderHook(() => useTableSort())
    expect(typeof result.current).toBe('object')
  })
})
