import prisma from '@/lib/prisma/client'

export const DEFAULT_LATE_BOOKING_DAYS = 14
export const DEFAULT_LATE_BOOKING_SURCHARGE = 50

export async function calculateBookingPrice(
  poolId: string,
  userId: string
): Promise<{
  basePrice: number
  surcharge: number
  total: number
  isLateBooking: boolean
}> {
  const pool = await prisma.examPool.findUnique({
    where: { id: poolId },
    include: { event: true },
  })

  if (!pool) {
    throw new Error('Pool not found')
  }

  const basePrice = Number(pool.seatPrice)
  const lateBookingDays = pool.event?.lateBookingDays ?? DEFAULT_LATE_BOOKING_DAYS
  const surchargeAmount = Number(pool.event?.lateBookingSurcharge ?? DEFAULT_LATE_BOOKING_SURCHARGE)

  const examDate = new Date(pool.examDate)
  const today = new Date()
  const daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  const isLateBooking = daysUntilExam <= lateBookingDays && daysUntilExam > 0

  return {
    basePrice,
    surcharge: isLateBooking ? surchargeAmount : 0,
    total: basePrice + (isLateBooking ? surchargeAmount : 0),
    isLateBooking,
  }
}

export function isLateBooking(
  examDate: Date,
  lateBookingDays: number = DEFAULT_LATE_BOOKING_DAYS
): boolean {
  const today = new Date()
  const daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return daysUntilExam <= lateBookingDays && daysUntilExam > 0
}

export function getDaysUntilExam(examDate: Date): number {
  const today = new Date()
  return Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}
