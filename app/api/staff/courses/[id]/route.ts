import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { updateCourseSchema, validateBody } from '@/lib/validation/schemas'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'

export const GET = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    await requireStaff()
    const id = context?.params?.id
    if (!id) return apiError('Course ID required')

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
    const id = context?.params?.id
    if (!id) return apiError('Course ID required')

    const body = await req.json()
    const validation = validateBody(updateCourseSchema, body)
    if (!validation.success) return apiError((validation as any).error)

    const course = await prisma.course.findUnique({ where: { id } })
    if (!course) return apiNotFound('Course not found')

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
