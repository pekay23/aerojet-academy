import prisma from '@/lib/prisma/client'
import { getSystemSetting } from '@/lib/settings'
import { chargeWallet } from '@/lib/wallet/operations'

/**
 * Books a standalone exam for an EXAM_ONLY student.
 * Supports booking a specific Exam ID, or a Module + Event combination.
 */
export async function bookStandaloneExam(
  userId: string,
  params: { examId?: string; moduleCode?: string; eventId?: string }
) {
  const { examId, moduleCode, eventId } = params

  let exam = null
  let courseCode = moduleCode
  let targetEventId = eventId
  let examComponentId = null
  let examDate = null
  let duration = 120 // Default 2 hours

  if (examId) {
    exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { examComponent: { include: { course: true } }, event: true },
    })
    if (!exam) throw new Error('Exam not found')
    courseCode = exam.examComponent.course.code
    targetEventId = exam.eventId
    examComponentId = exam.examComponentId
    examDate = exam.examDate
    duration = exam.duration
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
    examDate = new Date(event.startDate)
    examDate.setHours(9, 0, 0, 0) // Default to 9 AM on start date
  } else {
    throw new Error('Missing booking parameters (Exam ID or Module + Event)')
  }

  const profile = await prisma.studentProfile.findUnique({ where: { userId } })
  if (!profile) throw new Error('Student profile not found')
  if (profile.enrollmentType === 'FULL_TIME') {
    throw new Error(
      'Full-Time students cannot book individual exams. They follow a strictly milestone-based path.'
    )
  }

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
  const wallet = await prisma.wallet.findUnique({ where: { userId } })
  if (amountToCharge > 0) {
    if (!wallet || Number(wallet.availableBalance) < amountToCharge) {
      throw new Error(`Insufficient wallet balance. This exam costs €${amountToCharge.toFixed(2)}.`)
    }
  }

  return prisma.$transaction(async (tx) => {
    // 1. Payment processing
    if (activeBundle) {
      await tx.examBundle.update({
        where: { id: activeBundle.id },
        data: { usedSeats: { increment: 1 } },
      })
    } else {
      await chargeWallet(
        tx,
        userId,
        amountToCharge,
        `Standalone Exam Booking: ${courseCode} - ${exam?.name || 'Individual Session'}`,
        examId || targetEventId!,
        examId ? 'EXAM_ID' : 'EVENT_ID'
      )
    }

    // 2. Pool Integration
    if (targetEventId) {
      // Duplicate check
      const duplicate = await tx.poolMembership.findFirst({
        where: {
          userId,
          pool: { eventId: targetEventId },
          examComponentId: examComponentId!,
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

      // Find or create pool
      const matchingPools = await tx.examPool.findMany({
        where: {
          eventId: targetEventId,
          examDate: examDate!,
          status: { in: ['OPEN', 'NEAR_FULL', 'CONFIRMED', 'DRAFT'] },
        },
      })

      let targetPool = null
      for (const pool of matchingPools) {
        if (pool.currentMemberCount >= pool.maxCandidates) continue
        if (pool.allowedModules.includes(courseCode!)) {
          targetPool = pool
          break
        }
        if (pool.allowedModules.length < pool.moduleDiversityCap) {
          targetPool = pool
          break
        }
      }

      if (targetPool) {
        const newAllowed = [...targetPool.allowedModules]
        if (!newAllowed.includes(courseCode!)) newAllowed.push(courseCode!)
        await tx.examPool.update({
          where: { id: targetPool.id },
          data: {
            currentMemberCount: { increment: 1 },
            allowedModules: newAllowed,
            status:
              targetPool.currentMemberCount + 1 >= targetPool.maxCandidates
                ? 'NEAR_FULL'
                : targetPool.status,
          },
        })
      } else {
        const endTime = new Date(examDate!.getTime() + duration * 60000)
        targetPool = await tx.examPool.create({
          data: {
            eventId: targetEventId,
            name: `Auto Pool - ${courseCode}`,
            examDate: examDate!,
            examStartTime: examDate!,
            examEndTime: endTime,
            status: 'OPEN',
            currentMemberCount: 1,
            allowedModules: [courseCode!],
            seatPrice: activeBundle ? 0 : individualPrice,
          },
        })
      }

      // Create membership
      await tx.poolMembership.create({
        data: {
          userId,
          poolId: targetPool.id,
          status: 'CONFIRMED',
          examComponentId: examComponentId!,
          amountReserved: 0, // Booked individually, so marked as 0 reserved (payment handled above)
        },
      })

      return { usedBundle: !!activeBundle, poolId: targetPool.id }
    }

    return { usedBundle: !!activeBundle }
  })
}

/**
 * Books a resit exam.
 */
export async function bookResitExam(examId: string, userId: string) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { examComponent: { include: { course: true } } },
  })

  if (!exam) throw new Error('Exam not found')

  const resitFeeSetting = await getSystemSetting('resit_exam_fee', '150')
  const resitFee = Number(resitFeeSetting)

  const wallet = await prisma.wallet.findUnique({ where: { userId } })
  if (!wallet || Number(wallet.availableBalance) < resitFee) {
    throw new Error(`Insufficient funds for resit. Cost: €${resitFee.toFixed(2)}`)
  }

  return prisma.$transaction(async (tx) => {
    await chargeWallet(
      tx,
      userId,
      resitFee,
      `Resit Booking: ${exam.examComponent.course.code}`,
      exam.id,
      'EXAM_ID'
    )

    // Log the resit attempt/booking (logic depends on results schema)
  })
}
