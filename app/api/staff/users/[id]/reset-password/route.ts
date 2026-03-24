import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getAuthSession, hashPassword } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { createAuditLog } from '@/lib/audit/logger'
import { randomBytes } from 'crypto'
import { wrapEmail, sendEmail } from '@/lib/email/service'

export const POST = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const session = await getAuthSession()
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)) {
      return apiError('Unauthorized', 401)
    }
    const staff = session.user
    const id = context?.params?.id
    if (!id) return apiError('User ID required')

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return apiNotFound('User not found')

    // Generate a random temporary password
    const tempPassword = randomBytes(4).toString('hex') // 8 chars
    const hashedPassword = await hashPassword(tempPassword)

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    })

    // Send email with tempPassword
    const emailBody = await wrapEmail(
      'Password Reset',
      `
      <div class="h1">Password Reset Successful</div>
      <div class="text">
        Your account password has been reset by an administrator. Please use the temporary password below to log in. 
        <b>We strongly recommend changing your password immediately after logging in.</b>
      </div>
      <div class="info-box">
        <div class="info-row"><strong>Email:</strong> ${user.email}</div>
        <div class="info-row"><strong>Temporary Password:</strong> <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #002a5c;">${tempPassword}</code></div>
      </div>
      <div class="btn-container">
        <a href="${process.env.NEXTAUTH_URL}/login" class="btn">Log In Now</a>
      </div>
    `
    )

    await sendEmail({
      to: user.personalEmail || user.email,
      subject: 'Temporary Password - Aerojet Academy',
      html: emailBody,
    })

    await createAuditLog({
      action: 'RESET_PASSWORD',
      entity: 'User',
      entityId: id,
      userId: staff.id,
      description: `Password reset for user ${user.email} by staff`,
    })

    return apiSuccess({ message: 'Password reset successfully', tempPassword })
  }
)
