import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getAuthSession, hashPassword } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { createAuditLog } from '@/lib/audit/logger'
import { randomBytes } from 'crypto'
import { UserRole } from '@prisma/client'

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

    // TODO: Send email with tempPassword
    console.log(`[Mock Email] Password reset for ${user.email}. New password: ${tempPassword}`)

    await createAuditLog({
      action: 'RESET_PASSWORD',
      entity: 'User',
      entityId: id,
      userId: staff.id,
      description: `Password reset for user ${user.email} by staff`,
    })

    return apiSuccess({ message: 'Password reset successfully', tempPassword }) // Returning tempPassword for dev/debug convenience
  }
)
