import prisma from '@/lib/prisma/client'
import { addMonths } from 'date-fns'

/**
 * Generates payment milestones for a Full-Time Enrollment.
 * Y1: 40% (Seat Confirmation), 30% (Sem 1 Due), 30% (Sem 2 Due)
 * Y2+: 50% (Sem 1 Due), 50% (Sem 2 Due)
 */
export async function generateMilestonesForYear(enrollmentId: string, yearId: string) {
  const enrollment = await prisma.fullTimeEnrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      programme: true,
      student: true,
    },
  })

  if (!enrollment) throw new Error('Enrollment not found')

  const progYear = await prisma.programmeYear.findUnique({
    where: { id: yearId },
  })

  if (!progYear) throw new Error('Programme Year not found')

  // Use year-specific fee amount, otherwise fallback to base programme year fee
  const feeBase = progYear.yearFeeAmount ?? enrollment.programme.yearFeeAmount
  const totalAmount = Number(feeBase)

  const milestoneData = []

  if (progYear.yearNumber === 1) {
    // Y1: 40% (Seat), 30% (Sem 1), 30% (Sem 2)
    milestoneData.push(
      {
        enrollmentId,
        yearNumber: 1,
        milestoneType: 'SEAT_CONFIRMATION',
        dueDate: new Date(), // Immediate
        percentOfYearFee: 40,
        amountDue: totalAmount * 0.4,
        status: 'DUE',
      },
      {
        enrollmentId,
        yearNumber: 1,
        milestoneType: 'SEM1_DUE',
        dueDate: progYear.semester1StartDate,
        percentOfYearFee: 30,
        amountDue: totalAmount * 0.3,
        status: 'DUE',
      },
      {
        enrollmentId,
        yearNumber: 1,
        milestoneType: 'SEM2_DUE',
        dueDate: progYear.semester2StartDate,
        percentOfYearFee: 30,
        amountDue: totalAmount * 0.3,
        status: 'DUE',
      }
    )
  } else {
    // Y2+: 50% (Sem 1), 50% (Sem 2)
    milestoneData.push(
      {
        enrollmentId,
        yearNumber: progYear.yearNumber,
        milestoneType: 'SEM1_DUE',
        dueDate: progYear.semester1StartDate,
        percentOfYearFee: 50,
        amountDue: totalAmount * 0.5,
        status: 'DUE',
      },
      {
        enrollmentId,
        yearNumber: progYear.yearNumber,
        milestoneType: 'SEM2_DUE',
        dueDate: progYear.semester2StartDate,
        percentOfYearFee: 50,
        amountDue: totalAmount * 0.5,
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

  return prisma.$transaction(async (tx) => {
    // 1. Charge wallet
    const chargeResult = await chargeWallet(
      tx,
      userId,
      amountToCharge,
      `Paid milestone: ${milestone.milestoneType} (Year ${milestone.yearNumber})`,
      milestone.id,
      'MILESTONE_ID'
    )

    // 2. Mark milestone as PAID
    const updatedMilestone = await tx.paymentMilestone.update({
      where: { id: milestone.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        // We'll just fetch the latest transaction created by chargeWallet
      },
    })

    // Auto upgrade role on first paid milestone
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

    return updatedMilestone
  })
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

  return prisma.$transaction(async (tx) => {
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
  })
}
