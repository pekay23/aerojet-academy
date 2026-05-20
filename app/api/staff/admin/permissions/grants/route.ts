import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, apiCreated, apiError } from '@/lib/api/response'
import { requirePermission } from '@/lib/auth/permissions'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'
import {
  ADDITIONAL_PERMISSION_KEYS,
  invalidatePermissionsFor,
  invalidateRolePermissions,
} from '@/lib/auth/permission-registry'

const grantSchema = z.object({
  scope: z.enum(['ROLE', 'USER']),
  targetKey: z.string().min(1),
  permissionKey: z.string().min(1),
  expiresAt: z.string().datetime().optional(),
  notes: z.string().max(280).optional(),
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const actor = await requirePermission(ADDITIONAL_PERMISSION_KEYS.MANAGE_RBAC)
  const body = grantSchema.parse(await req.json())

  const perm = await prismaUnfiltered.permission.findUnique({ where: { key: body.permissionKey } })
  if (!perm) return apiError('Unknown permission key', 400)

  // Resolve scope target — for ROLE scope it must be a known role string;
  // for USER scope it must be a real user id.
  if (body.scope === 'USER') {
    const user = await prismaUnfiltered.user.findUnique({
      where: { id: body.targetKey },
      select: { id: true, role: true, deletedAt: true },
    })
    if (!user || user.deletedAt) return apiError('Target user not found', 400)
  }

  const grant = await prismaUnfiltered.roleGrant.upsert({
    where: {
      scope_targetKey_permissionKey: {
        scope: body.scope,
        targetKey: body.targetKey,
        permissionKey: body.permissionKey,
      },
    },
    create: {
      scope: body.scope,
      targetKey: body.targetKey,
      permissionKey: body.permissionKey,
      grantedById: actor.id,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      notes: body.notes,
    },
    update: {
      grantedById: actor.id,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      notes: body.notes,
    },
  })

  await createAuditLog({
    userId: actor.id,
    action: 'CREATE',
    entity: 'RoleGrant',
    entityId: grant.id,
    description: `Granted ${body.permissionKey} to ${body.scope}:${body.targetKey}`,
    changes: { after: grant },
  })

  if (body.scope === 'USER') invalidatePermissionsFor(body.targetKey)
  else invalidateRolePermissions(body.targetKey)

  return apiCreated(grant)
})
