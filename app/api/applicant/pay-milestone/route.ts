import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { chargeWallet } from '@/lib/wallet/operations'
import { triggerAutoEnrollmentByUserId } from '@/lib/enrollment/engine'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

// POST /api/applicant/pay-milestone — Pay a DUE milestone from wallet balance
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getAuthSession()
  if (!session) return apiError('Unauthorized', 401)

  const userId = (session.user as any).id

  let body: any
  try {
    body = await req.json()
  } catch {
    return apiError('Invalid request body', 400)
  }

  const { milestoneId } = body
  if (!milestoneId) return apiError('milestoneId is required')

  // Fetch milestone with enrollment to verify ownership
  const milestone = await prisma.paymentMilestone.findUnique({
    where: { id: milestoneId },
    include: { enrollment: true },
  })

  if (!milestone) return apiError('Milestone not found', 404)
  if (milestone.enrollment.studentId !== userId) return apiError('Unauthorized', 403)
  if (milestone.status === 'PAID') return apiError('Milestone is already paid')
  if (milestone.status !== 'DUE' && milestone.status !== 'OVERDUE') {
    return apiError(`Cannot pay milestone with status: ${milestone.status}`)
  }

  const amountToCharge = Number(milestone.amountDue)

  // Check wallet balance
  const wallet = await prisma.wallet.findUnique({ where: { userId } })
  if (!wallet || Number(wallet.availableBalance) < amountToCharge) {
    return apiError(
      `Insufficient wallet balance. Need ${amountToCharge.toLocaleString()}, available: ${Number(wallet?.availableBalance ?? 0).toLocaleString()}`
    )
  }

  // Execute payment in a transaction
  const result = await prisma.$transaction(async (tx) => {
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
      data: { status: 'PAID', paidAt: new Date() },
    })

    // 3. Check if promotion conditions are now met
    //    SEAT_CONFIRMATION must be PAID to promote
    const allMilestones = await tx.paymentMilestone.findMany({
      where: { enrollmentId: milestone.enrollmentId, yearNumber: 1 },
    })
    const seatPaid = allMilestones.some(
      (m) =>
        m.milestoneType === 'SEAT_CONFIRMATION' &&
        (m.id === milestone.id ? true : m.status === 'PAID')
    )

    const user = await tx.user.findUnique({ where: { id: userId } })
    let promoted = false

    if (milestone.milestoneType === 'SEAT_CONFIRMATION') {
      // Activate enrollment immediately when seat is paid
      await tx.fullTimeEnrollment.update({
        where: { id: milestone.enrollmentId },
        data: { status: 'ACTIVE' },
      })
    }

    if (user?.role === 'APPLICANT' && seatPaid) {
      // Promote: create StudentProfile if needed, change role
      const existingProfile = await tx.studentProfile.findUnique({ where: { userId } })
      if (!existingProfile) {
        const { generateStudentId } = await import('@/lib/auth/helpers')
        const studentId = await generateStudentId()

        const { mapProgrammeChoiceToPathwayCode } = await import('@/lib/enrollment/pathway')
        const pathwayCode = mapProgrammeChoiceToPathwayCode(user.programmeChoice)
        const pathway = await tx.studyPathwayModel.findUnique({ where: { code: pathwayCode } })

        await tx.studentProfile.create({
          data: {
            userId,
            studentId,
            enrollmentType: 'FULL_TIME',
            pathwayId: pathway?.id ?? null,
            enrollmentStatus: 'ENROLLED',
          },
        })
      } else {
        await tx.studentProfile.update({
          where: { userId },
          data: { enrollmentStatus: 'ENROLLED' },
        })
      }

      await tx.user.update({
        where: { id: userId },
        data: { role: 'STUDENT' },
      })

      // Activate enrollment
      await tx.fullTimeEnrollment.update({
        where: { id: milestone.enrollmentId },
        data: { status: 'ACTIVE' },
      })

      promoted = true
    }

    return { updated, promoted }
  })

  // Post-transaction: trigger auto-enrollment if promoted
  if (result.promoted) {
    await triggerAutoEnrollmentByUserId(userId)
  }

  await createAuditLog({
    action: AuditAction.PAYMENT_APPROVE,
    entity: 'PaymentMilestone',
    entityId: milestoneId,
    userId,
    details: {
      milestoneType: milestone.milestoneType,
      yearNumber: milestone.yearNumber,
      amount: amountToCharge,
      promoted: result.promoted,
    },
  })

  return apiSuccess({
    message: result.promoted
      ? 'Milestone paid — you have been promoted to Student!'
      : 'Milestone paid successfully',
    promoted: result.promoted,
  })
})
