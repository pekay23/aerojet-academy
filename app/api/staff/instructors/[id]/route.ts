import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler, RouteContext } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'

// GET — single instructor detail
export const GET = withErrorHandler(async (_req: NextRequest, ctx?: RouteContext) => {
  await requireStaff()
  const { id } = (await ctx!.params) as { id: string }

  const instructor = await prismaUnfiltered.instructorProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          status: true,
          profile: { select: { firstName: true, lastName: true, phone: true } },
        },
      },
      instructorQualifications: { orderBy: { issueDate: 'desc' } },
      instructorRecency: { orderBy: { date: 'desc' } },
      classesInstructed: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, courseId: true },
      },
    },
  })

  if (!instructor) return apiError('Instructor not found', 404)
  return apiSuccess(instructor)
})

// PUT — update instructor profile
export const PUT = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  const staff = await requireStaff()
  const { id } = (await ctx!.params) as { id: string }
  const body = await req.json()

  const instructor = await prismaUnfiltered.instructorProfile.findUnique({
    where: { id },
    select: { userId: true },
  })

  if (!instructor) return apiError('Instructor not found', 404)

  const updated = await prismaUnfiltered.instructorProfile.update({
    where: { id },
    data: {
      department: body.department,
      specialization: body.specialization,
      modulesQualified: body.modulesQualified || [],
    },
  })

  await createAuditLog({
    action: AuditAction.UPDATE,
    entity: 'InstructorProfile',
    entityId: id,
    userId: staff.id,
    description: `Updated instructor profile ${id}`,
    changes: body,
  })

  return apiSuccess(updated)
})
