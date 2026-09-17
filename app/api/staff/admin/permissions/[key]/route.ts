import { NextRequest } from 'next/server'
import { withErrorHandler, apiSuccess, apiError , RouteContext } from '@/lib/api/response'
import { requirePermission } from '@/lib/auth/permissions'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'
import {
  ADDITIONAL_PERMISSION_KEYS,
  invalidateAllPermissions,
} from '@/lib/auth/permission-registry'

export const DELETE = withErrorHandler(async (
  _req: NextRequest, ctx?: RouteContext) => {
  const actor = await requirePermission(ADDITIONAL_PERMISSION_KEYS.MANAGE_RBAC)
  const { key } = (await ctx!.params) as { key: string }

  const existing = await prismaUnfiltered.permission.findUnique({ where: { key } })
  if (!existing) return apiError('Permission not found', 404)
  if (existing.isSystem) return apiError('Cannot delete a system permission', 400)

  await prismaUnfiltered.permission.delete({ where: { key } })

  await createAuditLog({
    userId: actor.id,
    action: 'DELETE',
    entity: 'Permission',
    entityId: key,
    description: `Permission ${key} deleted`,
    changes: { before: existing },
  })
  invalidateAllPermissions()
  return apiSuccess({ deleted: true })
})
