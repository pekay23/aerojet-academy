import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { Prisma } from '@prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import {
  apiCreated,
  apiError,
  apiPaginated,
  withErrorHandler,
} from '@/lib/api/response'
import { parsePagination, parseSearch } from '@/lib/api/response'
import { createCourseSchema, validateBody } from '@/lib/validation/schemas'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { serializePrisma } from '@/lib/utils/serialization'

// GET /api/staff/courses
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)
  const search = parseSearch(searchParams)
  const categoryFilter = searchParams.get('category')

  const where: Prisma.CourseWhereInput = {}
  if (categoryFilter) where.categoryId = categoryFilter
  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [courses, total] = await Promise.all([
    prismaUnfiltered.course.findMany({
      where,
      include: { _count: { select: { enrollments: true, classes: true } } },
      orderBy: { code: 'asc' },
      skip,
      take: limit,
    }),
    prismaUnfiltered.course.count({ where }),
  ])

  return apiPaginated(serializePrisma(courses), total, page, limit)
})

// POST /api/staff/courses
export const POST = withErrorHandler(async (req: NextRequest) => {
  const staff = await requireStaff()
  const body = await req.json()
  const validation = validateBody(createCourseSchema, body)
  if (validation.success === false) return apiError(validation.error)

  const existing = await prismaUnfiltered.course.findUnique({ where: { code: validation.data.code } })
  if (existing) return apiError('Course code already exists', 409)

  const course = await prismaUnfiltered.course.create({ 
    data: {
      ...validation.data,
      moduleType: validation.data.moduleType ?? null,
      prerequisites: validation.data.prerequisites || [],
      topics: validation.data.topics || [],
      applicableCategories: validation.data.applicableCategories || [],
    }
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
