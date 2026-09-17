import prisma from '@/lib/prisma/client'
import { upgradeRoleInTransaction } from './pathway'

export async function bookTuitionSession(sessionId: string, userId: string) {
  const sessionData = await prisma.tuitionRun.findUnique({
    where: { id: sessionId },
  })

  if (!sessionData) throw new Error('Tuition Session not found')
  if (sessionData.status !== 'SCHEDULED' && sessionData.status !== 'OPEN') {
    throw new Error('This session is no longer open for booking')
  }

  if (sessionData.currentEnrollments >= sessionData.capacity) {
    throw new Error('This session is full')
  }

  // Check if booking already exists
  const existing = await prisma.tuitionBooking.findFirst({
    where: { studentId: userId, tuitionRunId: sessionId },
  })

  if (existing) throw new Error('You are already booked for this session')

  const amountToCharge = Number(sessionData.price)

  const wallet = await prisma.wallet.findUnique({ where: { userId } })
  if (!wallet || Number(wallet.availableBalance) < amountToCharge) {
    throw new Error('Insufficient wallet balance to book this session.')
  }

  const { chargeWallet } = await import('@/lib/wallet/operations')

  return prisma.$transaction(async (tx) => {
    // 1. Direct charge to wallet
    const _chargeResult = await chargeWallet(
      tx,
      userId,
      amountToCharge,
      `Booked Tuition Session: ${sessionData.title}`,
      sessionData.id,
      'TUITION_ID'
    )

    // 2. Create the Booking
    const booking = await tx.tuitionBooking.create({
      data: {
        studentId: userId,
        tuitionRunId: sessionId,
        status: 'CONFIRMED',
        amountPaid: amountToCharge,
      },
    })

    // 3. Update Run Count
    await tx.tuitionRun.update({
      where: { id: sessionId },
      data: {
        currentEnrollments: { increment: 1 },
      },
    })

    // 4. Role Upgrade
    await upgradeRoleInTransaction(tx, userId)

    return booking
  })
}
