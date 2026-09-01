import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWalletBalance } from '@/hooks/use-wallet-balance'

describe('hooks/use-wallet-balance', () => {
  it('exports useWalletBalance', async () => {
    const mod = await import('@/hooks/use-wallet-balance')
    expect(mod.useWalletBalance).toBeDefined()
  })

  it('returns an object', () => {
    const { result } = renderHook(() => useWalletBalance())
    expect(typeof result.current).toBe('object')
  })
})
