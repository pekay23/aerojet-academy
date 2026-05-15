import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'

// PUT — approve/reject upgrade request
export const PUT = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const staff = await requireStaff()
  const { id } = await ctx.params
  const { action, notes, newDeadline } = await req.json()

  const request = await prismaUnfiltered.programmeUpgradeRequest.findUnique({
    where: { id },
    include: { application: true },
  })
  if (!request) return apiError('Upgrade request not found', 404)
  if (request.status !== 'PENDING') return apiError('Request is not pending')

  if (action === 'APPROVE') {
    await prismaUnfiltered.$transaction(async (tx) => {
      // Update the upgrade request
      await tx.programmeUpgradeRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedBy: staff.id,
          approvedAt: new Date(),
          notes: notes || null,
        },
      })

      // Update the application programme choice and deadline
      await tx.application.update({
        where: { id: request.applicationId },
        data: {
          programmeChoice: request.toProgramme,
          completionDeadline: newDeadline ? new Date(newDeadline) : undefined,
        },
      })

      // Update student profile programme
      await tx.studentProfile.update({
        where: { id: request.studentProfileId },
        data: {
          programmeChoice: request.toProgramme,
        },
      })

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: staff.id,
          action: 'PROGRAMME_UPGRADE_APPROVED',
          targetType: 'PROGRAMME_UPGRADE',
          targetId: id,
          metadata: {
            from: request.fromProgramme,
            to: request.toProgramme,
            studentProfileId: request.studentProfileId,
          },
        },
      })
    })

    return apiSuccess({ status: 'APPROVED' })
  } else if (action === 'REJECT') {
    await prismaUnfiltered.programmeUpgradeRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedBy: staff.id,
        approvedAt: new Date(),
        notes: notes || null,
      },
    })

    return apiSuccess({ status: 'REJECTED' })
  }

  return apiError('Invalid action')
})
