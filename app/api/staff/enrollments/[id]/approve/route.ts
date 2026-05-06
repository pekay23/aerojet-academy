import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { generateStudentId } from '@/lib/auth/helpers'
import { requirePermission, PERMISSIONS } from '@/lib/auth/permissions'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { sendStudentPromotionEmail } from '@/lib/email/service'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { UserRole, EnrollmentStatus } from '@prisma/client'

// POST /api/staff/enrollments/[id]/approve
export const POST = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requirePermission(PERMISSIONS.MANAGE_ENROLLMENTS)
    const id = context?.params?.id
    if (!id) return apiError('Enrollment ID required')

    const enrollment = await prismaUnfiltered.enrollment.findUnique({
      where: { id },
      include: {
        user: { include: { profile: true, studentProfile: true } },
        course: true,
      },
    })

    if (!enrollment) return apiNotFound('Enrollment not found')
    if (enrollment.status !== 'PENDING')
      return apiError(`Enrollment is already ${enrollment.status}`)

    const user = enrollment.user

    await prismaUnfiltered.$transaction(async (tx) => {
      // 1. Approve the enrollment
      await tx.enrollment.update({
        where: { id },
        data: {
          status: EnrollmentStatus.ENROLLED,
          enrolledAt: new Date(),
        },
      })

      // 2. If user is APPLICANT, promote to STUDENT
      if (user.role === 'APPLICANT') {
        const studentId = await generateStudentId()

        await tx.user.update({
          where: { id: user.id },
          data: { role: UserRole.STUDENT },
        })

        // Create StudentProfile if not exists
        if (!user.studentProfile) {
          await tx.studentProfile.create({
            data: {
              userId: user.id,
              studentId,
              enrollmentType: 'MODULAR', // Defaulting as selectedProgramme doesn't exist on User
            },
          })
        }

        // Create Wallet if not exists
        const existingWallet = await tx.wallet.findUnique({ where: { userId: user.id } })
        if (!existingWallet) {
          await tx.wallet.create({
            data: { userId: user.id, balance: 0, reservedBalance: 0, availableBalance: 0 },
          })
        }

        // Send promotion email
        if (user.profile) {
          const targetEmail = user.personalEmail || user.email
          await sendStudentPromotionEmail(targetEmail, user.profile.firstName, studentId).catch(
            console.error
          )
          // Academy email domain not active — skip sending there
        }
      }

      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Course Enrollment Approved',
          message: `Your enrollment in ${enrollment.course.code} has been approved.`,
          type: 'SUCCESS',
          linkUrl: '/student/courses',
          linkText: 'View Courses',
        },
      })
    })

    await createAuditLog({
      action: AuditAction.ENROLLMENT_APPROVE,
      entity: 'Enrollment',
      entityId: id,
      userId: staff.id,
      details: {
        targetUserId: user.id,
        courseCode: enrollment.course.code,
        promoted: user.role === 'APPLICANT',
      },
    })

    return apiSuccess({ message: 'Enrollment approved', enrollmentId: id })
  }
)
