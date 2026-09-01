'use server'

import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { revalidatePath } from 'next/cache'
import { EnrollmentStatus } from '@prisma/client'
import { handleActionError } from '@/lib/staff/errors'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { getRequestContext } from '@/lib/server/request-context'

export async function bulkUpdateEnrollmentStatus(enrollmentIds: string[], status: EnrollmentStatus) {
  try {
    const user = await requireStaff()
    if (!enrollmentIds.length || !status) return { error: 'Invalid parameters.' }

    if (['APPROVED', 'ACTIVE', 'GRADUATED'].includes(status)) {
      const enrollments = await prismaUnfiltered.enrollment.findMany({
        where: { id: { in: enrollmentIds } },
        include: { course: true }
      })

      await prismaUnfiltered.$transaction(
        enrollments.map((e) =>
          prismaUnfiltered.enrollment.update({
            where: { id: e.id },
            data: { 
              status,
              amountPaid: e.amountPaid && Number(e.amountPaid) > 0 ? e.amountPaid : e.course.price 
            },
          })
        )
      )
    } else {
      await prismaUnfiltered.enrollment.updateMany({
        where: { id: { in: enrollmentIds } },
        data: { status },
      })
    }

    revalidatePath('/staff/enrollments')

    const ctx = await getRequestContext()
    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'Enrollment',
      entityId: enrollmentIds[0],
      userId: user.id,
      description: `Bulk updated enrollment status to ${status} for ${enrollmentIds.length} enrollments`,
      changes: { enrollmentIds, status },
      ...ctx,
    })

    return { success: true }
  } catch (error) {
    return { error: handleActionError('bulkUpdateEnrollmentStatus', error, 'Failed to update enrollments.') }
  }
}

export async function bulkDeleteEnrollments(enrollmentIds: string[]) {
  try {
    const user = await requireStaff()
    if (!enrollmentIds.length) return { error: 'No enrollments selected.' }

    await prismaUnfiltered.enrollment.deleteMany({
      where: { id: { in: enrollmentIds } },
    })

    revalidatePath('/staff/enrollments')

    const ctx = await getRequestContext()
    await createAuditLog({
      action: AuditAction.DELETE,
      entity: 'Enrollment',
      entityId: enrollmentIds[0],
      userId: user.id,
      description: `Bulk deleted ${enrollmentIds.length} enrollments`,
      changes: { enrollmentIds },
      ...ctx,
    })

    return { success: true }
  } catch (error) {
    return { error: handleActionError('bulkDeleteEnrollments', error, 'Failed to delete enrollments.') }
  }
}
