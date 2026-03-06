import prisma from '@/lib/prisma/client'
import { getSystemSetting } from '@/lib/settings'
import { chargeWallet } from '@/lib/wallet/operations'

/**
 * Books a standalone exam for an EXAM_ONLY student.
 * Pricing is dynamic, fetched from system settings or defaulting to €520.
 */
export async function bookStandaloneExam(examId: string, userId: string) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { examComponent: { include: { course: true } }, event: true },
  })

  if (!exam) throw new Error('Exam not found')

  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
  })

  if (!profile) throw new Error('Student profile not found')

  // Check pathway restrictions
  if (profile.enrollmentType === 'FULL_TIME') {
    throw new Error(
      'Full-Time students cannot book individual exams. They follow a strictly milestone-based path.'
    )
  }

  // Fetch dynamic price
  const settingPrice = await getSystemSetting('individual_exam_fee', '520')
  const individualPrice = Number(settingPrice)

  // Check for active bundle first
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

  const courseCode = exam.examComponent?.course?.code || 'UNKNOWN'

  return prisma.$transaction(async (tx) => {
    // 1. Consume bundle seat or charge wallet
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
        `Standalone Exam Booking: ${courseCode} - ${exam.name}`,
        exam.id,
        'EXAM_ID'
      )
    }

    // 1.5 Pool Integration Logic
    if (exam.eventId) {
      // Check if user already booked this module in this event
      const duplicate = await tx.poolMembership.findFirst({
        where: {
          userId,
          pool: { eventId: exam.eventId },
          examComponentId: exam.examComponentId,
          status: { in: ['RESERVED', 'CONFIRMED'] },
        },
      })
      if (duplicate) {
        throw new Error(`You are already booked for module ${courseCode} in this exam event.`)
      }

      // Check if user already in 4 distinct pools for this event
      const userPools = await tx.poolMembership.count({
        where: {
          userId,
          pool: { eventId: exam.eventId },
          status: { in: ['RESERVED', 'CONFIRMED'] },
        },
      })
      if (userPools >= 4) {
        throw new Error('You can join at most 4 pools in a single exam event.')
      }

      // Find matching pool
      const matchingPools = await tx.examPool.findMany({
        where: {
          eventId: exam.eventId,
          examDate: exam.examDate,
          status: { in: ['OPEN', 'NEAR_FULL', 'CONFIRMED', 'DRAFT'] },
        },
      })

      let targetPool = null
      for (const pool of matchingPools) {
        if (pool.currentMemberCount >= pool.maxCandidates) continue
        if (pool.allowedModules.includes(courseCode)) {
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
        if (!newAllowed.includes(courseCode)) {
          newAllowed.push(courseCode)
        }
        await tx.examPool.update({
          where: { id: targetPool.id },
          data: {
            currentMemberCount: targetPool.currentMemberCount + 1,
            allowedModules: newAllowed,
            status:
              targetPool.currentMemberCount + 1 >= targetPool.maxCandidates
                ? 'NEAR_FULL'
                : targetPool.status,
          },
        })
      } else {
        const endTime = new Date(exam.examDate.getTime() + exam.duration * 60000)
        targetPool = await tx.examPool.create({
          data: {
            eventId: exam.eventId,
            name: `Auto Pool - ${courseCode}`,
            examDate: exam.examDate,
            examStartTime: exam.examDate,
            examEndTime: endTime,
            status: 'OPEN',
            currentMemberCount: 1,
            allowedModules: [courseCode],
            seatPrice: activeBundle ? 0 : individualPrice,
          },
        })
      }

      await tx.poolMembership.create({
        data: {
          userId,
          poolId: targetPool.id,
          examComponentId: exam.examComponentId,
          status: 'CONFIRMED',
          amountReserved: amountToCharge,
          amountPaid: amountToCharge,
          discountType: activeBundle ? 'BUNDLE' : 'NONE',
        },
      })
    }

    // 2. Create the Booking
    const booking = await tx.examBooking.create({
      data: {
        userId,
        examId,
        examComponentId: exam.examComponentId,
        bookingType: 'INDIVIDUAL',
        moduleCode: courseCode,
        amountPaid: amountToCharge,
        status: 'APPROVED', // Auto-approved because paid
        examDate: exam.examDate,
      },
    })

    // 3. Upgrade role if needed
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (user?.role === 'APPLICANT') {
      await tx.user.update({
        where: { id: userId },
        data: { role: 'STUDENT' },
      })
      await tx.studentProfile.update({
        where: { userId },
        data: { enrollmentStatus: 'ENROLLED' },
      })
    }

    return { booking, usedBundle: !!activeBundle }
  })
}

/**
 * Books a resit exam for a student who has failed a previous attempt.
 * Resit fee is fetched from the exam's event (if set), otherwise from system settings.
 */
export async function bookResitExam(examId: string, userId: string) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      examComponent: { include: { course: true } },
      event: true,
    },
  })

  if (!exam) throw new Error('Exam not found')

  // Check if they have a failed result for this course's exam component
  const previousResults = await prisma.examResult.findMany({
    where: {
      userId,
      exam: { examComponentId: exam.examComponentId },
    },
  })

  const hasFailed = previousResults.some((r) => !r.passed)
  if (!hasFailed) {
    throw new Error(
      'You are only eligible for a resit if you have a recorded fail for this course.'
    )
  }

  // Fetch resit price - prefer event-specific, fallback to system setting
  let amountToCharge: number
  if (exam.event && exam.event.resitFee) {
    amountToCharge = Number(exam.event.resitFee)
  } else {
    const settingPrice = await getSystemSetting('resit_exam_fee', '480')
    amountToCharge = Number(settingPrice)
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId } })
  if (!wallet || Number(wallet.availableBalance) < amountToCharge) {
    throw new Error(`Insufficient wallet balance for resit. Fee: €${amountToCharge.toFixed(2)}.`)
  }

  const courseCode = exam.examComponent?.course?.code || 'UNKNOWN'

  return prisma.$transaction(async (tx) => {
    // 1. Charge wallet
    await chargeWallet(
      tx,
      userId,
      amountToCharge,
      `Exam Resit: ${courseCode} - ${exam.name}`,
      exam.id,
      'EXAM_RESIT_ID'
    )

    // 2. Create the Booking
    const booking = await tx.examBooking.create({
      data: {
        userId,
        examId,
        examComponentId: exam.examComponentId,
        bookingType: 'INDIVIDUAL',
        moduleCode: courseCode,
        amountPaid: amountToCharge,
        status: 'APPROVED',
        examDate: exam.examDate,
      },
    })

    return booking
  })
}
