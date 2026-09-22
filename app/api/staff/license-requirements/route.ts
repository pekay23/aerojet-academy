import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireAdmin } from '@/lib/auth/helpers'
import { revalidateTag } from 'next/cache'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { z } from 'zod'

const licenseRequirementSchema = z.object({
  licenseCategoryId: z.string().uuid(),
  courseId: z.string().uuid(),
  action: z.enum(['add', 'remove']),
})

// GET /api/staff/license-requirements — Get all license categories with their required modules
export const GET = withErrorHandler(async () => {
  await requireAdmin()

  const [licenseCategories, courses] = await Promise.all([
    prismaUnfiltered.licenseCategory.findMany({
      include: {
        requirements: {
          include: { course: { select: { id: true, code: true, name: true } } },
        },
      },
      orderBy: { code: 'asc' },
    }),
    prismaUnfiltered.course.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    }),
  ])

  return apiSuccess({ licenseCategories, courses })
})

// POST /api/staff/license-requirements — Add or remove a module requirement
export const POST = withErrorHandler(async (req: NextRequest) => {
  const staff = await requireAdmin()
  const body = await req.json()
  const validation = licenseRequirementSchema.safeParse(body)

  if (!validation.success) {
    return apiError('licenseCategoryId, courseId, and action (add/remove) are required')
  }

  const { licenseCategoryId, courseId, action } = validation.data

  // Validate that the course is active before creating a requirement
  const course = await prismaUnfiltered.course.findUnique({
    where: { id: courseId },
    select: { id: true, isActive: true },
  })

  if (!course) {
    return apiError('Course not found', 404)
  }

  if (!course.isActive) {
    return apiError('Course is inactive', 409)
  }

  if (action === 'add') {
    const result = await prismaUnfiltered.licenseModuleRequirement.upsert({
      where: { licenseCategoryId_courseId: { licenseCategoryId, courseId } },
      update: {},
      create: { licenseCategoryId, courseId },
    })

    await createAuditLog({
      action: AuditAction.CREATE,
      entity: 'LicenseModuleRequirement',
      entityId: `${licenseCategoryId}_${courseId}`,
      userId: staff.id,
      description: `Added module requirement: ${courseId} to ${licenseCategoryId}`,
      changes: { before: null, after: { licenseCategoryId, courseId } },
    })

    revalidateTag('license-requirements', 'max')

    return apiSuccess({ message: 'Requirement added', upserted: !!result })
  } else if (action === 'remove') {
    const result = await prismaUnfiltered.licenseModuleRequirement.deleteMany({
      where: { licenseCategoryId, courseId },
    })

    await createAuditLog({
      action: AuditAction.DELETE,
      entity: 'LicenseModuleRequirement',
      entityId: `${licenseCategoryId}_${courseId}`,
      userId: staff.id,
      description: `Removed module requirement: ${courseId} from ${licenseCategoryId}`,
      changes: { before: { licenseCategoryId, courseId }, after: null },
    })

    revalidateTag('license-requirements', 'max')

    return apiSuccess({ message: 'Requirement removed', deleted: result.count })
  }

  return apiError('Action must be "add" or "remove"')
})
