import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { apiSuccess, withErrorHandler, RouteContext } from '@/lib/api/response'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'

export const POST = withErrorHandler(async (_req: NextRequest, _ctx: RouteContext) => {
  const staff = await requireStaff()

  // Find all FULL_TIME_4YEAR students without OJT logbooks
  const ojtEligibleMissing = await prismaUnfiltered.studentProfile.findMany({
    where: {
      programmeChoice: 'FULL_TIME_4YEAR',
      ojtLogbook: { is: null },
    },
    include: {
      licenseTargets: {
        include: { licenseCategory: true },
      },
    },
  })

  if (ojtEligibleMissing.length === 0) {
    return apiSuccess({ provisioned: 0, message: 'No eligible students missing OJT logbooks.' })
  }

  const logbookCreates = ojtEligibleMissing.flatMap((student) => {
    const licenceCategoryId = student.licenseTargets[0]?.licenseCategoryId
    if (!licenceCategoryId) {
      console.warn(
        `[OJT] Skipped auto-provision for student ${student.studentId}: no license target found`
      )
      return []
    }
    return [
      prismaUnfiltered.oJTLogbook.create({
        data: {
          studentProfileId: student.id,
          licenceCategoryId,
          facilityName: 'Aerojet Academy',
          startDate: new Date(),
          status: 'ACTIVE',
        },
      }),
    ]
  })

  const created = await Promise.all(logbookCreates)

  // Audit log for each created logbook
  for (const logbook of created) {
    await createAuditLog({
      action: AuditAction.CREATE,
      entity: 'OJTLogbook',
      entityId: logbook.id,
      userId: staff.id,
      description: `Auto-provisioned OJT logbook for student ${logbook.studentProfileId}`,
    })
  }

  return apiSuccess({
    provisioned: created.length,
    message: `Successfully provisioned ${created.length} OJT logbook(s).`,
  })
})
