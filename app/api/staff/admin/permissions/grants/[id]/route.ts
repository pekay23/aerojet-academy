import { NextRequest } from 'next/server'
import { withErrorHandler, apiSuccess, apiError } from '@/lib/api/response'
import { requirePermission } from '@/lib/auth/permissions'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'
import {
  ADDITIONAL_PERMISSION_KEYS,
  invalidatePermissionsFor,
  invalidateRolePermissions,
} from '@/lib/auth/permission-registry'

export const DELETE = withErrorHandler(async (
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) => {
  const actor = await requirePermission(ADDITIONAL_PERMISSION_KEYS.MANAGE_RBAC)
  const { id } = await ctx.params

  const existing = await prismaUnfiltered.roleGrant.findUnique({ where: { id } })
  if (!existing) return apiError('Grant not found', 404)

  await prismaUnfiltered.roleGrant.delete({ where: { id } })

  await createAuditLog({
    userId: actor.id,
    action: 'DELETE',
    entity: 'RoleGrant',
    entityId: id,
    description: `Revoked ${existing.permissionKey} from ${existing.scope}:${existing.targetKey}`,
    changes: { before: existing },
  })

  if (existing.scope === 'USER') invalidatePermissionsFor(existing.targetKey)
  else invalidateRolePermissions(existing.targetKey)

  return apiSuccess({ revoked: true })
})
