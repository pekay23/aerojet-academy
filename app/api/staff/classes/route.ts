import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiCreated, apiError, apiPaginated, withErrorHandler } from '@/lib/api/response'
import { parsePagination } from '@/lib/api/response'
import { createClassSchema, validateBody } from '@/lib/validation/schemas'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { findConflicts } from '@/lib/scheduling/conflicts'

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)

  const [classes, total] = await Promise.all([
    prismaUnfiltered.class.findMany({
      include: {
        course: { select: { code: true, name: true } },
        instructor: {
          include: {
            user: { include: { profile: { select: { firstName: true, lastName: true } } } },
          },
        },
        _count: { select: { attendanceRecords: true } },
      },
      orderBy: { startDate: 'desc' },
      skip,
      take: limit,
    }),
    prismaUnfiltered.class.count(),
  ])
  return apiPaginated(classes, total, page, limit)
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const staff = await requireStaff()
  const body = await req.json()
  const validation = validateBody(createClassSchema, body)
  if (!validation.success) return apiError(validation.error)

  // Check for duplicate class name in course
  const existingClass = await prismaUnfiltered.class.findFirst({
    where: {
      courseId: validation.data.courseId,
      name: validation.data.name,
    },
  })

  if (existingClass) {
    return apiError('Class with this name already exists for this course', 409)
  }

  const cls = await prismaUnfiltered.class.create({ data: validation.data })

  // Post-create conflict probe — return 409 + the new class id so the UI can
  // offer "go fix it" or "I know, keep it" (resubmit with force:true).
  const force = (body as any)?.force === true
  if (!force) {
    const windowFrom = new Date(validation.data.startDate)
    const windowTo = new Date(validation.data.endDate)
    windowTo.setDate(windowTo.getDate() + 90)
    const conflicts = await findConflicts({ from: windowFrom, to: windowTo })
    const involvesNew = conflicts.filter(
      (c) => c.a.classId === cls.id || c.b.classId === cls.id
    )
    if (involvesNew.length > 0) {
      return apiError(
        'Class created but has scheduling conflicts. Review at /staff/timetable/conflicts or POST again with force:true to silence.',
        409,
        { classId: cls.id, conflicts: involvesNew.slice(0, 10) }
      )
    }
  }

  await createAuditLog({
    action: AuditAction.CREATE,
    entity: 'Class',
    entityId: cls.id,
    userId: staff.id,
  })
  return apiCreated(cls)
})
