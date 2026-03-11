import prisma from '@/lib/prisma/client'
import { getSystemSetting } from '@/lib/settings'
import { addToAutoPool } from '@/lib/pools/auto-pool'

/** Resolve an ExamComponent by its unique code. Accepts an optional transaction client. */
export async function findExamComponentByCode(code: string, tx: typeof prisma = prisma) {
  return tx.examComponent.findFirst({ where: { code }, include: { course: true } })
}

/**
 * Books a standalone exam for an EXAM_ONLY student.
 * Routes through the auto-pool system — student is placed in a holding pool
 * and redistributed into standard pools at booking deadline.
 */
export async function bookStandaloneExam(
  userId: string,
  params: { examId?: string; moduleCode?: string; eventId?: string }
) {
  const { examId, moduleCode, eventId } = params

  let courseCode = moduleCode
  let targetEventId = eventId
  let examComponentId: string | null = null

  if (examId) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { examComponent: { include: { course: true } }, event: true },
    })
    if (!exam) throw new Error('Exam not found')
    courseCode = exam.examComponent.course.code
    targetEventId = exam.eventId ?? undefined
    examComponentId = exam.examComponentId
  } else if (moduleCode && eventId) {
    const comp = await prisma.examComponent.findFirst({
      where: { code: moduleCode },
      include: { course: true },
    })
    if (!comp) throw new Error(`Exam component for module ${moduleCode} not found`)
    examComponentId = comp.id
    const event = await prisma.examEvent.findUnique({ where: { id: eventId } })
    if (!event) throw new Error('Exam event not found')
    targetEventId = event.id
  } else {
    throw new Error('Missing booking parameters (Exam ID or Module + Event)')
  }

  if (!targetEventId) throw new Error('No exam event associated with this booking.')
  if (!examComponentId) throw new Error('Exam component could not be resolved.')

  // Pricing
  const settingPrice = await getSystemSetting('individual_exam_fee', '520')
  const individualPrice = Number(settingPrice)

  // Bundle check
  const bundles = await prisma.examBundle.findMany({
    where: { userId, status: 'ACTIVE' },
    orderBy: { createdAt: 'asc' },
  })
  const activeBundle = bundles.find((b) => b.usedSeats < b.totalSeats) || null
  const amountToCharge = activeBundle ? 0 : individualPrice

  // Balance check (before transaction)
  if (amountToCharge > 0) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!wallet || Number(wallet.availableBalance) < amountToCharge) {
      throw new Error(`Insufficient wallet balance. This exam costs €${amountToCharge.toFixed(2)}.`)
    }
  }

  return prisma.$transaction(async (tx) => {
    // Use bundle seat if available
    if (activeBundle) {
      await tx.examBundle.update({
        where: { id: activeBundle.id },
        data: { usedSeats: { increment: 1 } },
      })
    }

    // Duplicate check
    const duplicate = await tx.poolMembership.findFirst({
      where: {
        userId,
        pool: { eventId: targetEventId },
        examComponentId,
        status: { in: ['RESERVED', 'CONFIRMED'] },
      },
    })
    if (duplicate) {
      throw new Error(`You are already booked for module ${courseCode} in this exam event.`)
    }

    // Event limit check
    const userPools = await tx.poolMembership.count({
      where: {
        userId,
        pool: { eventId: targetEventId },
        status: { in: ['RESERVED', 'CONFIRMED'] },
      },
    })
    if (userPools >= 4) {
      throw new Error('You can join at most 4 pools in a single exam event.')
    }

    // Route through auto-pool
    const result = await addToAutoPool({
      userId,
      eventId: targetEventId,
      bookingType: 'INDIVIDUAL',
      examComponentId,
      moduleCode: courseCode!,
      amount: amountToCharge,
      tx,
    })

    return { usedBundle: !!activeBundle, poolId: result.autoPool.id, bookingId: result.booking.id }
  })
}

/**
 * Books a resit exam for a specific module into an upcoming event.
 * Routes through auto-pool — seat is assigned at booking deadline.
 */
export async function bookResitExam(userId: string, moduleCode: string, eventId: string) {
  const [comp, event] = await Promise.all([
    prisma.examComponent.findFirst({
      where: { code: moduleCode },
      include: { course: true },
    }),
    prisma.examEvent.findUnique({ where: { id: eventId } }),
  ])

  if (!comp) throw new Error(`Exam component for module ${moduleCode} not found`)
  if (!event) throw new Error('Exam event not found')

  // Get resit fee from event or system setting
  let resitFee = 480
  if (event.resitFee) {
    resitFee = Number(event.resitFee)
  } else {
    const resitFeeSetting = await getSystemSetting('resit_exam_fee', '480')
    resitFee = Number(resitFeeSetting)
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId } })
  if (!wallet || Number(wallet.availableBalance) < resitFee) {
    throw new Error(`Insufficient funds for resit. Cost: €${resitFee.toFixed(2)}`)
  }

  return prisma.$transaction(async (tx) => {
    // Duplicate check
    const duplicate = await tx.poolMembership.findFirst({
      where: {
        userId,
        pool: { eventId },
        examComponentId: comp.id,
        status: { in: ['RESERVED', 'CONFIRMED'] },
      },
    })
    if (duplicate) {
      throw new Error(`You already have a booking for ${moduleCode} in this event.`)
    }

    // Route through auto-pool with resit type
    const result = await addToAutoPool({
      userId,
      eventId,
      bookingType: 'RESIT',
      examComponentId: comp.id,
      moduleCode: comp.course.code,
      amount: resitFee,
      isResit: true,
      tx,
    })

    return { bookingId: result.booking.id, poolId: result.autoPool.id }
  })
}
