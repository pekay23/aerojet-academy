import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { softDeleteData } from '@/lib/prisma/soft-delete'

// PATCH /api/staff/courses/[id]/exam-components/[componentId]
export const PATCH = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const componentId = context?.params?.componentId
    if (!componentId) return apiError('Component ID required')

    const body = await req.json()
    const { code, name, type, duration, individualPrice, poolPrice, questionCount, categoryCode } = body

    const component = await prisma.examComponent.findUnique({ where: { id: componentId } })
    if (!component) return apiNotFound('Exam component not found')

    const updated = await prisma.examComponent.update({
      where: { id: componentId },
      data: {
        ...(code !== undefined && { code }),
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(duration !== undefined && { duration: parseInt(duration) }),
        ...(individualPrice !== undefined && {
          individualPrice: individualPrice ? parseFloat(individualPrice) : null,
        }),
        ...(poolPrice !== undefined && { poolPrice: poolPrice ? parseFloat(poolPrice) : null }),
        ...(questionCount !== undefined && { questionCount: questionCount ? parseInt(questionCount) : null }),
        ...(categoryCode !== undefined && { categoryCode: categoryCode || null }),
      },
    })

    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'ExamComponent',
      entityId: componentId,
      userId: staff.id,
      details: body,
    })

    return apiSuccess(updated)
  }
)

// DELETE /api/staff/courses/[id]/exam-components/[componentId]
export const DELETE = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const componentId = context?.params?.componentId
    if (!componentId) return apiError('Component ID required')

    const component = await prisma.examComponent.findUnique({
      where: { id: componentId },
      include: {
        _count: { select: { exams: true, bookings: true, poolMemberships: true } },
      },
    })
    if (!component) return apiNotFound('Exam component not found')

    const url = new URL(req.url)
    const transfer = url.searchParams.get('transfer')
    const force = url.searchParams.get('force') === 'true'
    const hasRelated = component._count.exams > 0 || component._count.bookings > 0

    // Auto-transfer: move bookings to a compatible component, then delete
    if (hasRelated && transfer === 'auto') {
      const courseId = context?.params?.id

      // Find a suitable replacement component (same course, same type, different ID)
      const replacement = await prisma.examComponent.findFirst({
        where: {
          courseId,
          type: component.type,
          id: { not: componentId },
        },
      })

      if (!replacement) {
        return apiError(
          'No compatible component found for auto-transfer. Create a replacement first.',
          409
        )
      }

      await prisma.$transaction(async (tx) => {
        // Transfer bookings to replacement
        await tx.examBooking.updateMany({
          where: { examComponentId: componentId },
          data: {
            examComponentId: replacement.id,
            moduleCode: replacement.code,
          },
        })

        // Transfer pool memberships to replacement
        await tx.poolMembership.updateMany({
          where: { examComponentId: componentId },
          data: { examComponentId: replacement.id },
        })

        // Delete remaining related records and the component
        await tx.exam.deleteMany({ where: { examComponentId: componentId } })
        await tx.examComponent.delete({ where: { id: componentId } })
      })

      await createAuditLog({
        action: AuditAction.DELETE,
        entity: 'ExamComponent',
        entityId: componentId,
        userId: staff.id,
        details: {
          code: component.code,
          transfer: 'auto',
          transferredTo: replacement.code,
          transferredToId: replacement.id,
          bookingsTransferred: component._count.bookings,
          poolMembershipsTransferred: component._count.poolMemberships,
          examsDeleted: component._count.exams,
        },
      })

      return apiSuccess({
        message: 'Exam component deleted, bookings transferred',
        transferredTo: replacement.code,
        bookingsTransferred: component._count.bookings,
      })
    }

    if (hasRelated && !force) {
      return apiError(
        `Cannot delete: has ${component._count.exams} exam(s) and ${component._count.bookings} booking(s). Use force=true to cascade delete or transfer=auto to transfer bookings.`,
        409
      )
    }

    if (hasRelated && force) {
      await prisma.$transaction(async (tx) => {
        // Delete in dependency order
        await tx.poolMembership.updateMany({ where: { examComponentId: componentId }, data: softDeleteData() })
        await tx.examBooking.updateMany({ where: { examComponentId: componentId }, data: softDeleteData() })
        await tx.exam.deleteMany({ where: { examComponentId: componentId } })
        await tx.examComponent.delete({ where: { id: componentId } })
      })
    } else {
      await prisma.examComponent.delete({ where: { id: componentId } })
    }

    await createAuditLog({
      action: AuditAction.DELETE,
      entity: 'ExamComponent',
      entityId: componentId,
      userId: staff.id,
      details: {
        code: component.code,
        force,
        cascaded: hasRelated ? {
          exams: component._count.exams,
          bookings: component._count.bookings,
          poolMemberships: component._count.poolMemberships,
        } : undefined,
      },
    })

    return apiSuccess({ message: 'Exam component deleted' })
  }
)
