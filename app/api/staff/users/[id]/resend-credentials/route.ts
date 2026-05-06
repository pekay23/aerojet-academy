import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff, hashPassword, generateToken, generateTempPassword } from '@/lib/auth/helpers'
import { sendActivationEmail, sendStudentPromotionEmail } from '@/lib/email/service'
import { createAuditLog } from '@/lib/audit/logger'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'

/**
 * POST /api/staff/users/[id]/resend-credentials
 *
 * Resets and resends login credentials to a user.
 */
export const POST = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const id = context?.params?.id
    if (!id) return apiError('User ID required')

    const user = await prismaUnfiltered.user.findUnique({
      where: { id },
      include: { profile: true, studentProfile: true },
    })

    if (!user) return apiNotFound('User not found')
    if (!user.profile) return apiError('User profile not found')

    // 1. Generate new temporary credentials
    const tempPassword = generateTempPassword()
    const hashedPassword = await hashPassword(tempPassword)
    const verifyToken = generateToken()
    const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // 2. Update user in database
    await prismaUnfiltered.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        verifyToken,
        verifyTokenExpires,
        mustChangePassword: true,
      },
    })

    // 3. Determine target emails
    const personalEmail = user.personalEmail || user.email
    const academyEmail = user.academyEmail
    const firstName = user.profile.firstName

    // 4. Send Activation Emails (credentials)
    const sendPromises = []

    // Always send to the main contact email (usually personal)
    sendPromises.push(
      sendActivationEmail(
        personalEmail,
        firstName,
        academyEmail || personalEmail,
        tempPassword,
        verifyToken
      ).catch((err) => console.error(`Failed to send activation to ${personalEmail}:`, err))
    )

    // 5. If User is a STUDENT, also resend their Student ID (Promotion Email)
    if (user.role === 'STUDENT' && user.studentProfile?.studentId) {
      const studentId = user.studentProfile.studentId

      sendPromises.push(
        sendStudentPromotionEmail(personalEmail, firstName, studentId).catch((err) =>
          console.error(`Failed to send promotion to ${personalEmail}:`, err)
        )
      )
    }

    await Promise.all(sendPromises)

    // 6. Log the action
    await createAuditLog({
      action: 'SYSTEM_UPDATE',
      entity: 'User',
      entityId: id,
      userId: staff.id,
      description: `Resent login credentials to ${personalEmail}${academyEmail ? ` and ${academyEmail}` : ''}. Password reset and token generated.`,
    })

    return apiSuccess({ message: 'Credentials resent successfully' })
  }
)
