import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { EnrollmentStatus, UserStatus } from '@prisma/client'

/**
 * PATCH /api/staff/users/[id]/enrollment-status
 *
 * Updates a student's enrollment status (ACTIVE, DEFERRED, SUSPENDED, WITHDRAWN, etc.)
 * and syncs the User status accordingly.
 */
export const PATCH = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const id = context?.params?.id
    if (!id) return apiError('User ID required')

    const body = await req.json()
    const { enrollmentStatus } = body as { enrollmentStatus: string }

    if (!enrollmentStatus || !Object.values(EnrollmentStatus).includes(enrollmentStatus as EnrollmentStatus)) {
      return apiError(`Invalid enrollment status: ${enrollmentStatus}`)
    }

    const user = await prismaUnfiltered.user.findUnique({
      where: { id },
      include: { studentProfile: true },
    })

    if (!user) return apiNotFound('User not found')
    if (!user.studentProfile) return apiError('User does not have a student profile')

    const previousStatus = user.studentProfile.enrollmentStatus

    // Map enrollment status to user status
    const userStatusMap: Record<string, UserStatus> = {
      SUSPENDED: UserStatus.SUSPENDED,
      WITHDRAWN: UserStatus.ARCHIVED,
      EXPELLED: UserStatus.ARCHIVED,
    }
    const newUserStatus = userStatusMap[enrollmentStatus] || UserStatus.ACTIVE

    await prismaUnfiltered.$transaction([
      prismaUnfiltered.studentProfile.update({
        where: { userId: id },
        data: { enrollmentStatus: enrollmentStatus as EnrollmentStatus },
      }),
      prismaUnfiltered.user.update({
        where: { id },
        data: { status: newUserStatus },
      }),
    ])

    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'StudentProfile',
      entityId: id,
      userId: staff.id,
      description: `Enrollment status changed from ${previousStatus} to ${enrollmentStatus}`,
      changes: {
        previousStatus,
        newStatus: enrollmentStatus,
        userStatus: newUserStatus,
      },
    })

    return apiSuccess({
      message: `Enrollment status updated to ${enrollmentStatus}`,
      enrollmentStatus,
      userStatus: newUserStatus,
    })
  }
)
