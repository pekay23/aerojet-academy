import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTableFilter } from '@/hooks/use-table-filter'

describe('hooks/use-table-filter', () => {
  it('exports useTableFilter', async () => {
    const mod = await import('@/hooks/use-table-filter')
    expect(mod.useTableFilter).toBeDefined()
  })

  it('returns an object', () => {
    const { result } = renderHook(() => useTableFilter())
    expect(typeof result.current).toBe('object')
  })
})
