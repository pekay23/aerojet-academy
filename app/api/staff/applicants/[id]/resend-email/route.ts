import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { sendRegistrationEmail } from '@/lib/email/service'

// POST /api/staff/applicants/[id]/resend-email
export const POST = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const id = context?.params?.id
    if (!id) return apiError('Applicant ID required')

    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    })

    if (!user) return apiNotFound('Applicant not found')

    if (!user.registrationCode) {
      return apiError('Applicant does not have a registration code to resend')
    }

    const firstName = user.profile?.firstName || 'Student'

    // Resend the registration email (contains payment details)
    await sendRegistrationEmail(user.email, firstName, user.registrationCode)

    await createAuditLog({
      action: 'SYSTEM_UPDATE' as unknown as AuditAction,
      entity: 'User',
      entityId: user.id,
      userId: staff.id,
      description: 'Resent payment details (registration) email to applicant',
    })

    return apiSuccess({ message: 'Payment details email sent successfully' })
  }
)
