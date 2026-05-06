import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiCreated, apiError, withErrorHandler } from '@/lib/api/response'
import { validateBody, createCourseSchema } from '@/lib/validation/schemas'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { serializePrisma } from '@/lib/utils/serialization'

export const POST = withErrorHandler(async (req: NextRequest) => {
  const staff = await requireStaff()

  const body = await req.json()
  const validation = validateBody(createCourseSchema, body)

  if (validation.success === false) {
    return apiError(validation.error)
  }

  const {
    code,
    name,
    description,
    categoryId,
    moduleType,
    duration,
    price,
    isActive,
    requiresPrerequisite,
    prerequisites,
    subtitle,
    topics,
    estimatedStudyHoursMin,
    estimatedStudyHoursMax,
    applicableCategories,
    hasCombinedExam,
    syllabusUrl,
    materialsUrl,
  } = validation.data

  const course = await prismaUnfiltered.course.create({
    data: {
      code,
      name,
      description,
      categoryId,
      moduleType: moduleType ?? null,
      duration,
      price,
      isActive,
      requiresPrerequisite,
      prerequisites: prerequisites || [],
      subtitle,
      topics: topics || [],
      estimatedStudyHoursMin,
      estimatedStudyHoursMax,
      applicableCategories: applicableCategories || [],
      hasCombinedExam,
      syllabusUrl,
      materialsUrl,
    },
  })

  await createAuditLog({
    action: AuditAction.CREATE,
    entity: 'Course',
    entityId: course.id,
    userId: staff.id,
    details: validation.data,
  })

  return apiCreated(serializePrisma(course))
})
