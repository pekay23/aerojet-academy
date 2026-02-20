import { describe, it, expect } from 'vitest'
import { calculateAvailableBalance } from '@/lib/utils'

describe('Wallet Operations', () => {
  it('calculates available balance correctly', () => {
    expect(calculateAvailableBalance(1500, 300)).toBe(1200)
    expect(calculateAvailableBalance(300, 300)).toBe(0)
    expect(calculateAvailableBalance(0, 0)).toBe(0)
  })

  it('never returns negative available balance', () => {
    expect(calculateAvailableBalance(100, 500)).toBe(0)
  })

  it('handles string inputs', () => {
    expect(calculateAvailableBalance('1500.00', '300.00')).toBe(1200)
  })
})
