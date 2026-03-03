/**
 * Pool Pricing Calculator — RULE 006
 *
 * Calculates the correct seat price for a candidate based on:
 * 1. Ambassador status (admin-editable discounted fee, default €270 lifetime)
 * 2. Multi-pool discount (3+ pools in same event → discounted fee)
 * 3. Standard pool fee (default €300)
 *
 * Discounts do NOT stack — only the best applicable price is used.
 * Late booking surcharge is added on top of the best price.
 */

import prisma from '@/lib/prisma/client'
import { getExamPricingConfig, type ExamPricingConfig } from './pricing-config'

export interface PriceCalculation {
  basePrice: number
  discount: string | null // 'ambassador' | 'multi_pool' | null
  surcharge: number // late booking surcharge
  totalPrice: number
  breakdown: string
}

/**
 * Calculate the pool seat price for a specific candidate in a specific event.
 */
export async function calculatePoolSeatPrice(
  userId: string,
  eventId: string,
  config?: ExamPricingConfig
): Promise<PriceCalculation> {
  const pricing = config || (await getExamPricingConfig())

  // Check ambassador status
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAmbassador: true },
  })
  const isAmbassador = user?.isAmbassador === true

  // Check multi-pool discount: count confirmed/reserved memberships in this event
  const existingPoolCount = await prisma.poolMembership.count({
    where: {
      userId,
      status: { in: ['RESERVED', 'CONFIRMED'] },
      pool: { eventId },
    },
  })
  const qualifiesForMultiPool = existingPoolCount >= 2 // This will be the 3rd+ pool

  // Determine best price (discounts don't stack)
  let basePrice = pricing.poolExamFee
  let discount: string | null = null

  if (isAmbassador) {
    basePrice = pricing.multiPoolDiscountFee // Ambassador = same discounted rate
    discount = 'ambassador'
  } else if (qualifiesForMultiPool) {
    basePrice = pricing.multiPoolDiscountFee
    discount = 'multi_pool'
  }

  // Check late booking surcharge
  const event = await prisma.examEvent.findUnique({
    where: { id: eventId },
    select: { startDate: true },
  })

  let surcharge = 0
  if (event?.startDate) {
    const daysUntilExam = Math.ceil(
      (event.startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    if (daysUntilExam <= pricing.lateBookingDays && daysUntilExam > 0) {
      surcharge = pricing.lateBookingSurcharge
    }
  }

  const totalPrice = basePrice + surcharge

  // Build breakdown string
  const parts: string[] = [`Base: €${basePrice}`]
  if (discount === 'ambassador') parts.push('(Ambassador discount)')
  if (discount === 'multi_pool') parts.push('(Multi-pool discount: 3+ in event)')
  if (surcharge > 0) parts.push(`+ €${surcharge} late booking surcharge`)

  return {
    basePrice,
    discount,
    surcharge,
    totalPrice,
    breakdown: parts.join(' '),
  }
}

/**
 * Calculate the individual exam seat price.
 */
export async function calculateIndividualPrice(
  eventId?: string,
  config?: ExamPricingConfig
): Promise<PriceCalculation> {
  const pricing = config || (await getExamPricingConfig())

  let surcharge = 0
  if (eventId) {
    const event = await prisma.examEvent.findUnique({
      where: { id: eventId },
      select: { startDate: true },
    })
    if (event?.startDate) {
      const daysUntilExam = Math.ceil(
        (event.startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      if (daysUntilExam <= pricing.lateBookingDays && daysUntilExam > 0) {
        surcharge = pricing.lateBookingSurcharge
      }
    }
  }

  const totalPrice = pricing.individualExamFee + surcharge
  const parts: string[] = [`Base: €${pricing.individualExamFee}`]
  if (surcharge > 0) parts.push(`+ €${surcharge} late booking surcharge`)

  return {
    basePrice: pricing.individualExamFee,
    discount: null,
    surcharge,
    totalPrice,
    breakdown: parts.join(' '),
  }
}

/**
 * Calculate resit exam price.
 */
export async function calculateResitPrice(config?: ExamPricingConfig): Promise<number> {
  const pricing = config || (await getExamPricingConfig())
  return pricing.resitExamFee
}

/**
 * Get bundle pricing info for display.
 */
export async function getBundlePricing(config?: ExamPricingConfig) {
  const pricing = config || (await getExamPricingConfig())
  return {
    twoSeat: {
      price: pricing.twoSeatBundle,
      seats: 2,
      perSeat: Math.round(pricing.twoSeatBundle / 2),
      savings: pricing.poolExamFee * 2 - pricing.twoSeatBundle,
    },
    fourSeat: {
      price: pricing.fourSeatBundle,
      seats: 4,
      perSeat: Math.round(pricing.fourSeatBundle / 4),
      savings: pricing.poolExamFee * 4 - pricing.fourSeatBundle,
    },
    groupCharter: {
      price: pricing.groupCharterFee,
      maxSeats: 28,
      perSeat: Math.round(pricing.groupCharterFee / 28),
    },
  }
}
