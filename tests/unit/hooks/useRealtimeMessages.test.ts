import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'

describe('hooks/useRealtimeMessages', () => {
  it('exports useRealtimeMessages', async () => {
    const mod = await import('@/hooks/useRealtimeMessages')
    expect(mod.useRealtimeMessages).toBeDefined()
  })

  it('can be called without error', () => {
    const { result } = renderHook(() => useRealtimeMessages(undefined))
    expect(result.error).toBeUndefined()
  })
})
