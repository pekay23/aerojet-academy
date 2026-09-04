import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff, generateToken } from '@/lib/auth/helpers'
import { sendEmailVerificationEmail, sendActivationEmail } from '@/lib/email/service'
import { createAuditLog } from '@/lib/audit/logger'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'

/**
 * POST /api/staff/users/[id]/resend-verification
 *
 * Resends the verification or activation email to a user.
 */
export const POST = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const id = context?.params?.id
    if (!id) return apiError('User ID required')

    const user = await prismaUnfiltered.user.findUnique({
      where: { id },
      include: { profile: true },
    })

    if (!user) return apiNotFound('User not found')
    if (!user.profile) return apiError('User profile not found')

    if (user.emailVerified) {
      return apiError('Email is already verified')
    }

    // 1. Generate new verification token
    const verifyToken = generateToken()
    const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // 2. Update user in database
    await prismaUnfiltered.user.update({
      where: { id },
      data: {
        verifyToken,
        verifyTokenExpires,
      },
    })

    const firstName = user.profile.firstName
    const personalEmail = user.personalEmail || user.email

    // 3. Send appropriate email
    if (user.password) {
      // Post-approval user: has credentials, send activation email
      await sendActivationEmail(
        personalEmail,
        firstName,
        user.academyEmail || personalEmail,
        '(use your existing password)',
        verifyToken
      )
    } else {
      // Pre-approval user: no credentials yet, send simple verification email
      await sendEmailVerificationEmail(personalEmail, firstName, verifyToken)
    }

    // 4. Log the action
    await createAuditLog({
      action: 'SYSTEM_UPDATE',
      entity: 'User',
      entityId: id,
      userId: staff.id,
      description: `Resent verification email to ${personalEmail}.`,
    })

    return apiSuccess({ message: 'Verification email resent successfully' })
  }
)
