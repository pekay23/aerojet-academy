import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

// POST /api/staff/courses/[id]/exam-components/transfer
export const POST = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const courseId = context?.params?.id
    if (!courseId) return apiError('Course ID required')

    const body = await req.json()
    const { sourceComponentId, targetComponentId, bookingIds } = body

    if (!sourceComponentId || !targetComponentId) {
      return apiError('sourceComponentId and targetComponentId are required')
    }

    if (sourceComponentId === targetComponentId) {
      return apiError('Source and target components must be different')
    }

    // Validate both components exist and belong to the same course
    const [source, target] = await Promise.all([
      prisma.examComponent.findUnique({ where: { id: sourceComponentId } }),
      prisma.examComponent.findUnique({ where: { id: targetComponentId } }),
    ])

    if (!source) return apiNotFound('Source exam component not found')
    if (!target) return apiNotFound('Target exam component not found')

    if (source.courseId !== courseId) {
      return apiError('Source component does not belong to this course')
    }
    if (target.courseId !== courseId) {
      return apiError('Target component does not belong to this course')
    }

    // Warn if types differ (but allow it — admin may explicitly want this)
    const typeMismatch = source.type !== target.type

    // Build the booking filter
    const bookingWhere: Record<string, unknown> = {
      examComponentId: sourceComponentId,
    }
    if (bookingIds && Array.isArray(bookingIds) && bookingIds.length > 0) {
      bookingWhere.id = { in: bookingIds }
    }

    // Execute transfer in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update bookings
      const bookingUpdate = await tx.examBooking.updateMany({
        where: bookingWhere,
        data: {
          examComponentId: targetComponentId,
          ...(target.code ? { moduleCode: target.code } : {}),
        },
      })

      // Update pool memberships from source to target
      const poolWhere: Record<string, unknown> = {
        examComponentId: sourceComponentId,
      }
      if (bookingIds && Array.isArray(bookingIds) && bookingIds.length > 0) {
        poolWhere.bookingId = { in: bookingIds }
      }

      const poolUpdate = await tx.poolMembership.updateMany({
        where: poolWhere,
        data: {
          examComponentId: targetComponentId,
        },
      })

      return {
        bookingsTransferred: bookingUpdate.count,
        poolMembershipsTransferred: poolUpdate.count,
      }
    })

    // Audit log
    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'ExamComponent',
      entityId: sourceComponentId,
      userId: staff.id,
      details: {
        operation: 'TRANSFER_BOOKINGS',
        sourceComponentId,
        sourceCode: source.code,
        targetComponentId,
        targetCode: target.code,
        typeMismatch,
        bookingIds: bookingIds || 'ALL',
        bookingsTransferred: result.bookingsTransferred,
        poolMembershipsTransferred: result.poolMembershipsTransferred,
      },
    })

    return apiSuccess({
      transferred: result.bookingsTransferred,
      poolMembershipsTransferred: result.poolMembershipsTransferred,
      sourceComponent: source.code,
      targetComponent: target.code,
      typeMismatch,
    })
  }
)
