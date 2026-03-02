import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { chargeWallet } from '@/lib/wallet/operations'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

// POST /api/student/milestones/pay — Pay a DUE milestone from wallet (for students)
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getAuthSession()
  if (!session) return apiError('Unauthorized', 401)

  const userId = (session.user as any).id

  // Verify user is a student
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.role !== 'STUDENT') return apiError('Only students can use this endpoint', 403)

  let body: any
  try {
    body = await req.json()
  } catch {
    return apiError('Invalid request body', 400)
  }

  const { milestoneId } = body
  if (!milestoneId) return apiError('milestoneId is required')

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

  const wallet = await prisma.wallet.findUnique({ where: { userId } })
  if (!wallet || Number(wallet.availableBalance) < amountToCharge) {
    return apiError(
      `Insufficient wallet balance. Need ${amountToCharge.toLocaleString()}, available: ${Number(wallet?.availableBalance ?? 0).toLocaleString()}`
    )
  }

  await prisma.$transaction(async (tx) => {
    await chargeWallet(
      tx,
      userId,
      amountToCharge,
      `Paid milestone: ${milestone.milestoneType} (Year ${milestone.yearNumber})`,
      milestone.id,
      'MILESTONE_ID'
    )

    await tx.paymentMilestone.update({
      where: { id: milestone.id },
      data: { status: 'PAID', paidAt: new Date() },
    })

    if (milestone.milestoneType === 'SEAT_CONFIRMATION') {
      await tx.fullTimeEnrollment.update({
        where: { id: milestone.enrollmentId },
        data: { status: 'ACTIVE' },
      })
    }
  })

  await createAuditLog({
    action: AuditAction.PAYMENT_APPROVE,
    entity: 'PaymentMilestone',
    entityId: milestoneId,
    userId,
    details: {
      milestoneType: milestone.milestoneType,
      yearNumber: milestone.yearNumber,
      amount: amountToCharge,
    },
  })

  return apiSuccess({ message: 'Milestone paid successfully' })
})
