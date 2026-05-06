import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

// GET /api/staff/license-requirements — Get all license categories with their required modules
export const GET = withErrorHandler(async () => {
  await requireStaff()

  const licenseCategories = await prismaUnfiltered.licenseCategory.findMany({
    include: {
      requirements: {
        include: { course: { select: { id: true, code: true, name: true } } },
      },
    },
    orderBy: { code: 'asc' },
  })

  const courses = await prismaUnfiltered.course.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true },
    orderBy: { code: 'asc' },
  })

  return apiSuccess({ licenseCategories, courses })
})

// POST /api/staff/license-requirements — Add or remove a module requirement
export const POST = withErrorHandler(async (req: NextRequest) => {
  const staff = await requireStaff()
  const body = await req.json()
  const { licenseCategoryId, courseId, action } = body

  if (!licenseCategoryId || !courseId || !action) {
    return apiError('licenseCategoryId, courseId, and action (add/remove) are required')
  }

  if (action === 'add') {
    await prismaUnfiltered.licenseModuleRequirement.upsert({
      where: { licenseCategoryId_courseId: { licenseCategoryId, courseId } },
      update: {},
      create: { licenseCategoryId, courseId },
    })

    await createAuditLog({
      action: AuditAction.CREATE,
      entity: 'LicenseModuleRequirement',
      entityId: `${licenseCategoryId}_${courseId}`,
      userId: staff.id,
      details: { licenseCategoryId, courseId },
    })
  } else if (action === 'remove') {
    await prismaUnfiltered.licenseModuleRequirement.deleteMany({
      where: { licenseCategoryId, courseId },
    })

    await createAuditLog({
      action: AuditAction.DELETE,
      entity: 'LicenseModuleRequirement',
      entityId: `${licenseCategoryId}_${courseId}`,
      userId: staff.id,
      details: { licenseCategoryId, courseId },
    })
  } else {
    return apiError('Action must be "add" or "remove"')
  }

  return apiSuccess({ message: `Requirement ${action === 'add' ? 'added' : 'removed'}` })
})
