import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePagination } from '@/hooks/use-pagination'

describe('hooks/use-pagination', () => {
  it('exports usePagination', async () => {
    const mod = await import('@/hooks/use-pagination')
    expect(mod.usePagination).toBeDefined()
  })

  it('returns an object', () => {
    const { result } = renderHook(() => usePagination())
    expect(typeof result.current).toBe('object')
  })
})
