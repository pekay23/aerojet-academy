import { NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { updateCourseSchema, validateBody } from '@/lib/validation/schemas'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { softDeleteData } from '@/lib/prisma/soft-delete'

// Helper: resolve param that could be a database ID or course code
async function resolveCourseId(param: string) {
  const course = await prismaUnfiltered.course.findFirst({
    where: { OR: [{ id: param }, { code: param }] },
    select: { id: true },
  })
  return course?.id ?? null
}

export const GET = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    await requireStaff()
    const param = context?.params?.id
    if (!param) return apiError('Course ID required')

    const id = await resolveCourseId(param)
    if (!id) return apiNotFound('Course not found')

    const course = await prismaUnfiltered.course.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: {
            user: { include: { profile: { select: { firstName: true, lastName: true } } } },
          },
        },
        classes: {
          include: {
            instructor: {
              include: {
                user: { include: { profile: { select: { firstName: true, lastName: true } } } },
              },
            },
          },
        },
        _count: { select: { enrollments: true, classes: true, examComponents: true } },
      },
    })

    if (!course) return apiNotFound('Course not found')
    return apiSuccess(course)
  }
)

export const PATCH = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const param = context?.params?.id
    if (!param) return apiError('Course ID required')

    const id = await resolveCourseId(param)
    if (!id) return apiNotFound('Course not found')

    const body = await req.json()
    const validation = validateBody(updateCourseSchema, body)
    if (!validation.success) return apiError(validation.error)

    const updated = await prismaUnfiltered.course.update({ where: { id }, data: validation.data })

    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'Course',
      entityId: id,
      userId: staff.id,
      details: validation.data,
    })

    revalidateTag('courses', 'max')
    return apiSuccess(updated)
  }
)

export const DELETE = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const param = context?.params?.id
    if (!param) return apiError('Course ID required')

    const id = await resolveCourseId(param)
    if (!id) return apiNotFound('Course not found')

    const course = await prismaUnfiltered.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: { enrollments: true, classes: true, examComponents: true, examBookings: true },
        },
      },
    })
    if (!course) return apiNotFound('Course not found')

    const url = new URL(req.url)
    const force = url.searchParams.get('force') === 'true'

    const hasRelated =
      course._count.enrollments > 0 ||
      course._count.classes > 0 ||
      course._count.examComponents > 0 ||
      course._count.examBookings > 0

    if (hasRelated && !force) {
      return apiError(
        `Cannot delete course: has ${course._count.enrollments} enrollment(s), ${course._count.classes} class(es), ${course._count.examComponents} exam component(s), ${course._count.examBookings} booking(s). Use force delete to cascade.`,
        409
      )
    }

    if (hasRelated && force) {
      await prismaUnfiltered.$transaction(async (tx) => {
        // Delete bookings first
        await tx.examBooking.updateMany({ where: { courseId: id }, data: softDeleteData() })
        // Exam component dependencies
        const componentIds = (
          await tx.examComponent.findMany({ where: { courseId: id }, select: { id: true } })
        ).map((c) => c.id)
        if (componentIds.length > 0) {
          await tx.poolMembership.updateMany({
            where: { examComponentId: { in: componentIds } },
            data: softDeleteData(),
          })
          await tx.exam.deleteMany({ where: { examComponentId: { in: componentIds } } })
          await tx.examComponent.deleteMany({ where: { courseId: id } })
        }
        await tx.enrollment.updateMany({ where: { courseId: id }, data: softDeleteData() })
        await tx.class.deleteMany({ where: { courseId: id } })
        await tx.licenseModuleRequirement.deleteMany({ where: { courseId: id } })
        await tx.termCourseAssignment.deleteMany({ where: { courseId: id } })
        await tx.course.delete({ where: { id } })
      })
    } else {
      await prismaUnfiltered.course.delete({ where: { id } })
    }

    await createAuditLog({
      action: AuditAction.DELETE,
      entity: 'Course',
      entityId: id,
      userId: staff.id,
      details: { code: course.code, force },
    })

    revalidateTag('courses', 'max')
    return apiSuccess({ message: 'Course deleted' })
  }
)
