import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { calculatePoolSeatPrice } from '@/lib/pools/pricing'

vi.mock('@/lib/pools/pricing-config', () => ({
  getExamPricingConfig: vi.fn(),
}))

import { getExamPricingConfig } from '@/lib/pools/pricing-config'

describe('lib/pools/pricing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns standard price when no discounts apply', async () => {
    ;(getExamPricingConfig as any).mockResolvedValue({
      poolExamFee: 300,
      multiPoolDiscountFee: 270,
      lateBookingSurcharge: 50,
      lateBookingDays: 3,
    })

    prismaMock.user.findUnique.mockResolvedValue({ isAmbassador: false })
    prismaMock.poolMembership.count.mockResolvedValue(0)
    prismaMock.examEvent.findUnique.mockResolvedValue({
      startDate: new Date(Date.now() + 86400000 * 30),
    })

    const result = await calculatePoolSeatPrice('user-1', 'event-1')

    expect(result.basePrice).toBe(300)
    expect(result.discount).toBeNull()
    expect(result.surcharge).toBe(0)
    expect(result.totalPrice).toBe(300)
  })

  it('applies ambassador discount', async () => {
    ;(getExamPricingConfig as any).mockResolvedValue({
      poolExamFee: 300,
      multiPoolDiscountFee: 270,
      lateBookingSurcharge: 50,
      lateBookingDays: 3,
    })

    prismaMock.user.findUnique.mockResolvedValue({ isAmbassador: true })
    prismaMock.examEvent.findUnique.mockResolvedValue({
      startDate: new Date(Date.now() + 86400000 * 30),
    })

    const result = await calculatePoolSeatPrice('user-1', 'event-1')

    expect(result.basePrice).toBe(270)
    expect(result.discount).toBe('ambassador')
    expect(result.totalPrice).toBe(270)
  })

  it('applies multi-pool discount when user has 2+ active memberships', async () => {
    ;(getExamPricingConfig as any).mockResolvedValue({
      poolExamFee: 300,
      multiPoolDiscountFee: 270,
      lateBookingSurcharge: 50,
      lateBookingDays: 3,
    })

    prismaMock.user.findUnique.mockResolvedValue({ isAmbassador: false })
    prismaMock.poolMembership.count.mockResolvedValue(2)
    prismaMock.examEvent.findUnique.mockResolvedValue({
      startDate: new Date(Date.now() + 86400000 * 30),
    })

    const result = await calculatePoolSeatPrice('user-1', 'event-1')

    expect(result.basePrice).toBe(270)
    expect(result.discount).toBe('multi_pool')
  })

  it('does not stack discounts — ambassador takes precedence', async () => {
    ;(getExamPricingConfig as any).mockResolvedValue({
      poolExamFee: 300,
      multiPoolDiscountFee: 270,
      lateBookingSurcharge: 50,
      lateBookingDays: 3,
    })

    prismaMock.user.findUnique.mockResolvedValue({ isAmbassador: true })
    prismaMock.poolMembership.count.mockResolvedValue(2)
    prismaMock.examEvent.findUnique.mockResolvedValue({
      startDate: new Date(Date.now() + 86400000 * 30),
    })

    const result = await calculatePoolSeatPrice('user-1', 'event-1')

    expect(result.discount).toBe('ambassador')
    expect(result.totalPrice).toBe(270)
  })

  it('adds late booking surcharge when within threshold', async () => {
    ;(getExamPricingConfig as any).mockResolvedValue({
      poolExamFee: 300,
      multiPoolDiscountFee: 270,
      lateBookingSurcharge: 50,
      lateBookingDays: 3,
    })

    prismaMock.user.findUnique.mockResolvedValue({ isAmbassador: false })
    prismaMock.poolMembership.count.mockResolvedValue(0)
    prismaMock.examEvent.findUnique.mockResolvedValue({
      startDate: new Date(Date.now() + 86400000 * 2),
    })

    const result = await calculatePoolSeatPrice('user-1', 'event-1')

    expect(result.surcharge).toBe(50)
    expect(result.totalPrice).toBe(350)
  })

  it('does not add surcharge when exam is beyond threshold', async () => {
    ;(getExamPricingConfig as any).mockResolvedValue({
      poolExamFee: 300,
      multiPoolDiscountFee: 270,
      lateBookingSurcharge: 50,
      lateBookingDays: 3,
    })

    prismaMock.user.findUnique.mockResolvedValue({ isAmbassador: false })
    prismaMock.poolMembership.count.mockResolvedValue(0)
    prismaMock.examEvent.findUnique.mockResolvedValue({
      startDate: new Date(Date.now() + 86400000 * 5),
    })

    const result = await calculatePoolSeatPrice('user-1', 'event-1')

    expect(result.surcharge).toBe(0)
  })

  it('handles missing event startDate gracefully', async () => {
    ;(getExamPricingConfig as any).mockResolvedValue({
      poolExamFee: 300,
      multiPoolDiscountFee: 270,
      lateBookingSurcharge: 50,
      lateBookingDays: 3,
    })

    prismaMock.user.findUnique.mockResolvedValue({ isAmbassador: false })
    prismaMock.poolMembership.count.mockResolvedValue(0)
    prismaMock.examEvent.findUnique.mockResolvedValue(null)

    const result = await calculatePoolSeatPrice('user-1', 'event-1')

    expect(result.surcharge).toBe(0)
    expect(result.totalPrice).toBe(300)
  })
})
