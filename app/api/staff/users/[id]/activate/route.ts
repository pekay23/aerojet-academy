import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { createAuditLog } from '@/lib/audit/logger'
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

    const updated = await prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
    })

    await createAuditLog({
      action: 'ACTIVATE_USER',
      entity: 'User',
      entityId: id,
      userId: staff.id,
      description: `User ${user.email} activated by staff`,
      changes: { status: 'ACTIVE', previousStatus: user.status },
    })

    return apiSuccess(updated)
  }
)
