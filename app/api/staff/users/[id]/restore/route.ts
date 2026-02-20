import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { createAuditLog } from '@/lib/audit/logger'
import { UserStatus } from '@prisma/client'

// POST /api/staff/users/[id]/restore
export const POST = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const session = await getAuthSession()
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)) {
      return apiError('Unauthorized', 401)
    }
    const staff = session.user
    const { id } = context!.params
    if (!id) return apiError('User ID required')

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return apiNotFound('User not found')

    // Restore archived user to active status
    await prisma.user.update({
      where: { id },
      data: { status: UserStatus.ACTIVE },
    })

    await createAuditLog({
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      userId: staff.id,
      description: `User ${user.email} restored from archive by staff`,
      changes: { email: user.email, status: UserStatus.ACTIVE, restored: true },
    })

    return apiSuccess({ message: 'User restored successfully' })
  }
)
