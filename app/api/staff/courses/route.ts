import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import {
  apiSuccess,
  apiCreated,
  apiError,
  apiPaginated,
  withErrorHandler,
} from '@/lib/api/response'
import { parsePagination, parseSearch } from '@/lib/api/response'
import { createCourseSchema, validateBody } from '@/lib/validation/schemas'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'

// GET /api/staff/courses
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)
  const search = parseSearch(searchParams)
  const categoryFilter = searchParams.get('category')

  const where: any = {}
  if (categoryFilter) where.category = categoryFilter
  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      include: { _count: { select: { enrollments: true, classes: true } } },
      orderBy: { code: 'asc' },
      skip,
      take: limit,
    }),
    prisma.course.count({ where }),
  ])

  return apiPaginated(courses, total, page, limit)
})

// POST /api/staff/courses
export const POST = withErrorHandler(async (req: NextRequest) => {
  const staff = await requireStaff()
  const body = await req.json()
  const validation = validateBody(createCourseSchema, body)
  if (validation.success === false) return apiError(validation.error)

  const existing = await prisma.course.findUnique({ where: { code: validation.data.code } })
  if (existing) return apiError('Course code already exists', 409)

  const course = await prisma.course.create({ data: validation.data })

  await createAuditLog({
    action: AuditAction.CREATE,
    entity: 'Course',
    entityId: course.id,
    userId: staff.id,
    details: { code: course.code, name: course.name },
  })

  return apiCreated(course)
})

