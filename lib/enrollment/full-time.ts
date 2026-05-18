import prisma from '@/lib/prisma/client'
import { MilestoneStatus } from '@prisma/client'
import { triggerAutoEnrollmentByUserId } from './engine'
import { upgradeRoleInTransaction } from './pathway'

/**
 * Generates payment milestones for a Full-Time Enrollment.
 * Split percentages are loaded from SystemSettings (admin-editable).
 * Defaults: Y1 = 40/30/30, Y2+ = 50/50.
 */
export async function generateMilestonesForYear(enrollmentId: string, yearId: string) {
  const { getPaymentSplitConfig } = await import('@/lib/settings')

  const [enrollment, progYear, splitConfig] = await Promise.all([
    prisma.fullTimeEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { programme: true, student: true },
    }),
    prisma.programmeYear.findUnique({ where: { id: yearId } }),
    getPaymentSplitConfig(),
  ])

  if (!enrollment) throw new Error('Enrollment not found')
  if (!progYear) throw new Error('Programme Year not found')

  // Use year-specific fee amount, otherwise derive from programme totalFee / duration
  const feeBase =
    progYear.yearFeeAmount ??
    Number(enrollment.programme.totalFee) / enrollment.programme.durationYears
  const totalAmount = Number(feeBase)

  const semesters = (progYear.semesters as any[]) || []
  const sem1Date =
    semesters.length > 0 && semesters[0].startDate ? new Date(semesters[0].startDate) : new Date()
  const sem2Date =
    semesters.length > 1 && semesters[1].startDate ? new Date(semesters[1].startDate) : new Date()

  const milestoneData: {
    enrollmentId: string
    yearNumber: number
    milestoneType: string
    dueDate: Date
    percentOfYearFee: number
    amountDue: number
    status: MilestoneStatus
  }[] = []

  if (progYear.yearNumber === 1) {
    milestoneData.push(
      {
        enrollmentId,
        yearNumber: 1,
        milestoneType: 'SEAT_CONFIRMATION',
        dueDate: new Date(), // Immediate
        percentOfYearFee: splitConfig.y1SeatPct,
        amountDue: totalAmount * (splitConfig.y1SeatPct / 100),
        status: 'DUE',
      },
      {
        enrollmentId,
        yearNumber: 1,
        milestoneType: 'SEM1_DUE',
        dueDate: sem1Date,
        percentOfYearFee: splitConfig.y1Sem1Pct,
        amountDue: totalAmount * (splitConfig.y1Sem1Pct / 100),
        status: 'DUE',
      },
      {
        enrollmentId,
        yearNumber: 1,
        milestoneType: 'SEM2_DUE',
        dueDate: sem2Date,
        percentOfYearFee: splitConfig.y1Sem2Pct,
        amountDue: totalAmount * (splitConfig.y1Sem2Pct / 100),
        status: 'DUE',
      }
    )
  } else {
    milestoneData.push(
      {
        enrollmentId,
        yearNumber: progYear.yearNumber,
        milestoneType: 'SEM1_DUE',
        dueDate: sem1Date,
        percentOfYearFee: splitConfig.y2Sem1Pct,
        amountDue: totalAmount * (splitConfig.y2Sem1Pct / 100),
        status: 'DUE',
      },
      {
        enrollmentId,
        yearNumber: progYear.yearNumber,
        milestoneType: 'SEM2_DUE',
        dueDate: sem2Date,
        percentOfYearFee: splitConfig.y2Sem2Pct,
        amountDue: totalAmount * (splitConfig.y2Sem2Pct / 100),
        status: 'DUE',
      }
    )
  }

  // Atomically create milestones
  const created = await prisma.$transaction(
    milestoneData.map((data) =>
      prisma.paymentMilestone.create({
        data,
      })
    )
  )

  return created
}

export async function processMilestonePayment(milestoneId: string, userId: string) {
  const milestone = await prisma.paymentMilestone.findUnique({
    where: { id: milestoneId },
    include: { enrollment: true },
  })

  if (!milestone) throw new Error('Milestone not found')
  if (milestone.enrollment.studentId !== userId) throw new Error('Unauthorized or invalid user')
  if (milestone.status === 'PAID') throw new Error('Milestone already paid')

  const amountToCharge = Number(milestone.amountDue)

  const wallet = await prisma.wallet.findUnique({ where: { userId } })
  if (!wallet || Number(wallet.availableBalance) < amountToCharge) {
    throw new Error('Insufficient wallet balance to pay this milestone')
  }

  const { chargeWallet } = await import('@/lib/wallet/operations')

  const updatedMilestone = await prisma.$transaction(async (tx) => {
    // 1. Charge wallet
    await chargeWallet(
      tx,
      userId,
      amountToCharge,
      `Paid milestone: ${milestone.milestoneType} (Year ${milestone.yearNumber})`,
      milestone.id,
      'MILESTONE_ID'
    )

    // 2. Mark milestone as PAID
    const updated = await tx.paymentMilestone.update({
      where: { id: milestone.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    })

    // 2.5 Special case: Seat confirmation activates enrollment
    if (milestone.milestoneType === 'SEAT_CONFIRMATION') {
      await tx.fullTimeEnrollment.update({
        where: { id: milestone.enrollmentId },
        data: { status: 'ACTIVE' },
      })
    }

    // 3. Check if promotion conditions are met:
    //    SEAT_CONFIRMATION must be PAID for applicant → student
    const allMilestones = await tx.paymentMilestone.findMany({
      where: { enrollmentId: milestone.enrollmentId, yearNumber: 1 },
    })
    const seatPaid = allMilestones.some(
      (m) =>
        m.milestoneType === 'SEAT_CONFIRMATION' &&
        (m.id === milestone.id ? true : m.status === 'PAID')
    )

    if (seatPaid) {
      await upgradeRoleInTransaction(tx, userId)
    }

    return updated
  })

  // 4. Post-transaction: trigger auto-enrollment for FT/Military pathways (if promoted)
  const postUser = await prisma.user.findUnique({ where: { id: userId } })
  if (postUser?.role === 'STUDENT') {
    await triggerAutoEnrollmentByUserId(userId)
  }

  return updatedMilestone
}

export async function payFullYear(enrollmentId: string, yearNumber: number, userId: string) {
  const enrollment = await prisma.fullTimeEnrollment.findUnique({
    where: { id: enrollmentId, studentId: userId },
    include: { milestones: { where: { yearNumber } } },
  })

  if (!enrollment) throw new Error('Enrollment not found')

  const unpaidMilestones = enrollment.milestones.filter(
    (m) => m.status === 'DUE' || m.status === 'OVERDUE'
  )
  if (unpaidMilestones.length === 0) throw new Error('No unpaid milestones for this year')

  const totalToCharge = unpaidMilestones.reduce((acc, m) => acc + Number(m.amountDue), 0)

  const wallet = await prisma.wallet.findUnique({ where: { userId } })
  if (!wallet || Number(wallet.availableBalance) < totalToCharge) {
    throw new Error('Insufficient wallet balance to pay the full year')
  }

  const { chargeWallet } = await import('@/lib/wallet/operations')

  await prisma.$transaction(async (tx) => {
    await chargeWallet(
      tx,
      userId,
      totalToCharge,
      `Paid full remaining balance for Year ${yearNumber}`,
      enrollment.id,
      'ENROLLMENT_ID'
    )

    // Mark them all as PAID
    for (const m of unpaidMilestones) {
      await tx.paymentMilestone.update({
        where: { id: m.id },
        data: { status: 'PAID', paidAt: new Date() },
      })
    }

    // Upgrade role
    await upgradeRoleInTransaction(tx, userId)
  })

  // Post-transaction: trigger auto-enrollment for FT/Military pathways
  await triggerAutoEnrollmentByUserId(userId)
}
