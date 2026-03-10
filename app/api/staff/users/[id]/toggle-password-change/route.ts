import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { createAuditLog } from '@/lib/audit/logger'

/**
 * POST /api/staff/users/[id]/toggle-password-change
 *
 * Toggles the mustChangePassword flag for a user.
 * Allows admin to temporarily bypass forced password change for verification,
 * then re-enable it afterward.
 */
export const POST = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const id = context?.params?.id
    if (!id) return apiError('User ID required')

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, mustChangePassword: true, passwordChanged: true },
    })

    if (!user) return apiNotFound('User not found')

    const newValue = !user.mustChangePassword

    await prisma.user.update({
      where: { id },
      data: { mustChangePassword: newValue },
    })

    await createAuditLog({
      action: 'SYSTEM_UPDATE',
      entity: 'User',
      entityId: id,
      userId: staff.id,
      description: newValue
        ? `Re-enabled forced password change for ${user.email}`
        : `Bypassed forced password change for ${user.email} (admin verification)`,
    })

    return apiSuccess({
      mustChangePassword: newValue,
      message: newValue
        ? 'Password change required on next login'
        : 'Password change bypassed — user can now log in without changing password',
    })
  },
)
