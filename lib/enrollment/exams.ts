import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma/client'
import { resolveStandardPoolForJoin } from '@/lib/pools/assignment'
import { joinPoolInternal } from '@/lib/pools/join'
import { getSystemSetting } from '@/lib/settings'
import { categoryMatchesTarget, getStudentTargetCategoryCodes } from '@/lib/easa/category-selection'

/** Resolve an ExamComponent by its unique code. Accepts an optional transaction client. */
export async function findExamComponentByCode(code: string, tx: typeof prisma = prisma) {
  return tx.examComponent.findFirst({ where: { code }, include: { course: true } })
}

export async function placeExamBookingInStandardPool(
  tx: Prisma.TransactionClient,
  params: {
    userId: string
    eventId: string
    examComponentId: string
    moduleCode: string
    bookingType: 'INDIVIDUAL' | 'RESIT' | 'TWIN_PACK' | 'FOUR_PACK'
    reserveAmount: number
    bundleId?: string | null
    isResit?: boolean
  }
) {
  const resolvedPool = await resolveStandardPoolForJoin(tx, {
    eventId: params.eventId,
    moduleCode: params.moduleCode,
  })

  const result = await joinPoolInternal(tx, {
    poolId: resolvedPool.id,
    userId: params.userId,
    examComponentId: params.examComponentId,
    eventId: params.eventId,
    moduleCode: params.moduleCode,
    bookingType: params.bookingType,
    reserveAmount: params.reserveAmount,
    amountPaid: params.reserveAmount,
    bundleId: params.bundleId,
    isResit: params.isResit,
  })

  if (!result.success || !result.booking || !result.membership) {
    throw new Error(result.error || 'Failed to place exam booking into a standard pool.')
  }

  return result
}

/**
 * Books a standalone exam for an EXAM_ONLY student.
 * Routes directly through the shared standard-pool assignment layer.
 */
export async function bookStandaloneExam(
  userId: string,
  params: { examId?: string; examComponentId?: string; moduleCode?: string; eventId?: string }
) {
  const { examId, examComponentId: requestedExamComponentId, moduleCode, eventId } = params

  let courseCode = moduleCode
  let targetEventId = eventId
  let examComponentId: string | null = null
  let componentCode: string | null = null
  let categoryCode: string | null = null

  if (examId) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { examComponent: { include: { course: true } }, event: true },
    })
    if (!exam) throw new Error('Exam not found')
    courseCode = exam.examComponent.course.code
    componentCode = exam.examComponent.code
    categoryCode = exam.examComponent.categoryCode
    targetEventId = exam.eventId ?? undefined
    examComponentId = exam.examComponentId
  } else if (requestedExamComponentId && eventId) {
    const comp = await prisma.examComponent.findUnique({
      where: { id: requestedExamComponentId },
      include: { course: true },
    })
    if (!comp) throw new Error('Exam component not found')
    courseCode = comp.course.code
    componentCode = comp.code
    categoryCode = comp.categoryCode
    examComponentId = comp.id
    const event = await prisma.examEvent.findUnique({ where: { id: eventId } })
    if (!event) throw new Error('Exam event not found')
    targetEventId = event.id
  } else if (moduleCode && eventId) {
    const comp = await prisma.examComponent.findFirst({
      where: { code: moduleCode },
      include: { course: true },
    })
    if (!comp) throw new Error(`Exam component for module ${moduleCode} not found`)
    examComponentId = comp.id
    componentCode = comp.code
    courseCode = comp.course.code
    categoryCode = comp.categoryCode
    const event = await prisma.examEvent.findUnique({ where: { id: eventId } })
    if (!event) throw new Error('Exam event not found')
    targetEventId = event.id
  } else {
    throw new Error('Missing booking parameters (Exam ID or Module + Event)')
  }

  if (!targetEventId) throw new Error('No exam event associated with this booking.')
  if (!examComponentId) throw new Error('Exam component could not be resolved.')

  const targetCategories = await getStudentTargetCategoryCodes(prisma, userId)
  if (targetCategories.length > 0 && !categoryMatchesTarget(categoryCode, targetCategories)) {
    throw new Error('This exam category is not part of the student licence pathway.')
  }

  const settingPrice = await getSystemSetting('individual_exam_fee', '520')
  const individualPrice = Number(settingPrice)
  const bundles = await prisma.examBundle.findMany({
    where: {
      userId,
      status: 'ACTIVE',
      validUntil: { gt: new Date() },
    },
    orderBy: { validUntil: 'asc' },
  })
  const activeBundle = bundles.find((bundle) => bundle.usedSeats < bundle.totalSeats) || null
  const amountToCharge = activeBundle ? 0 : individualPrice

  if (amountToCharge > 0) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!wallet || Number(wallet.availableBalance) < amountToCharge) {
      throw new Error(`Insufficient wallet balance. This exam costs EUR ${amountToCharge.toFixed(2)}.`)
    }
  }

  return prisma.$transaction(async (tx) => {
    const result = await placeExamBookingInStandardPool(tx, {
      userId,
      eventId: targetEventId,
      examComponentId,
      moduleCode: courseCode!,
      bookingType: 'INDIVIDUAL',
      reserveAmount: amountToCharge,
      bundleId: activeBundle?.id || null,
    })

    return { usedBundle: !!activeBundle, poolId: result.pool!.id, bookingId: result.booking.id, componentCode }
  })
}

/**
 * Books a resit exam for a specific module into an upcoming event.
 * Routes directly through the shared standard-pool assignment layer.
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

  const targetCategories = await getStudentTargetCategoryCodes(prisma, userId)
  if (targetCategories.length > 0 && !categoryMatchesTarget(comp.categoryCode, targetCategories)) {
    throw new Error('This resit category is not part of the student licence pathway.')
  }

  let resitFee = 480
  if (event.resitFee) {
    resitFee = Number(event.resitFee)
  } else {
    const resitFeeSetting = await getSystemSetting('resit_exam_fee', '480')
    resitFee = Number(resitFeeSetting)
  }

  // Audit 1c: a bundle with remaining free-resit entitlement covers this resit
  // at no charge (Twin Pack = 1, Four Pack = 2). Earliest-expiring first.
  const bundlesWithFreeResits = await prisma.examBundle.findMany({
    where: {
      userId,
      status: { in: ['ACTIVE', 'USED', 'EXHAUSTED'] },
      validUntil: { gt: new Date() },
    },
    orderBy: { validUntil: 'asc' },
  })
  const freeResitBundle =
    bundlesWithFreeResits.find((b) => b.usedFreeResits < b.freeResitsIncluded) ?? null
  const chargeFee = freeResitBundle ? 0 : resitFee

  if (chargeFee > 0) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!wallet || Number(wallet.availableBalance) < chargeFee) {
      throw new Error(`Insufficient funds for resit. Cost: EUR ${chargeFee.toFixed(2)}`)
    }
  }

  return prisma.$transaction(async (tx) => {
    if (freeResitBundle) {
      await tx.examBundle.update({
        where: { id: freeResitBundle.id },
        data: { usedFreeResits: { increment: 1 } },
      })
    }

    const result = await placeExamBookingInStandardPool(tx, {
      userId,
      eventId,
      examComponentId: comp.id,
      moduleCode: comp.course.code,
      bookingType: 'RESIT',
      reserveAmount: chargeFee,
      bundleId: freeResitBundle?.id ?? null,
      isResit: true,
    })

    return {
      bookingId: result.booking.id,
      poolId: result.pool!.id,
      usedFreeResit: !!freeResitBundle,
    }
  })
}
