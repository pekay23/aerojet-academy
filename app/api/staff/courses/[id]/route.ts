import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { updateCourseSchema, validateBody } from '@/lib/validation/schemas'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'

// Helper: resolve param that could be a database ID or course code
async function resolveCourseId(param: string) {
  const course = await prisma.course.findFirst({
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

    const course = await prisma.course.findUnique({
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
    if (!validation.success) return apiError((validation as any).error)

    const updated = await prisma.course.update({ where: { id }, data: validation.data as any })

    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'Course',
      entityId: id,
      userId: staff.id,
      details: validation.data as any,
    })

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

    const course = await prisma.course.findUnique({
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
      await prisma.$transaction(async (tx) => {
        // Delete bookings first
        await tx.examBooking.deleteMany({ where: { courseId: id } })
        // Exam component dependencies
        const componentIds = (
          await tx.examComponent.findMany({ where: { courseId: id }, select: { id: true } })
        ).map((c) => c.id)
        if (componentIds.length > 0) {
          await tx.poolMembership.deleteMany({ where: { examComponentId: { in: componentIds } } })
          await tx.exam.deleteMany({ where: { examComponentId: { in: componentIds } } })
          await tx.examComponent.deleteMany({ where: { courseId: id } })
        }
        await tx.enrollment.deleteMany({ where: { courseId: id } })
        await tx.class.deleteMany({ where: { courseId: id } })
        await tx.licenseModuleRequirement.deleteMany({ where: { courseId: id } })
        await tx.termCourseAssignment.deleteMany({ where: { courseId: id } })
        await tx.course.delete({ where: { id } })
      })
    } else {
      await prisma.course.delete({ where: { id } })
    }

    await createAuditLog({
      action: AuditAction.DELETE,
      entity: 'Course',
      entityId: id,
      userId: staff.id,
      details: { code: course.code, force },
    })

    return apiSuccess({ message: 'Course deleted' })
  }
)
