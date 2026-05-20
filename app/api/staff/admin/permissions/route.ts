import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, apiSuccess, apiCreated, apiError } from '@/lib/api/response'
import { requirePermission } from '@/lib/auth/permissions'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'
import {
  ADDITIONAL_PERMISSION_KEYS,
  invalidateAllPermissions,
} from '@/lib/auth/permission-registry'

const createSchema = z.object({
  key: z.string().min(2).max(64).regex(/^[A-Z][A-Z0-9_]*$/, 'Use SCREAMING_SNAKE_CASE'),
  label: z.string().min(2).max(80),
  description: z.string().max(280).optional(),
  category: z.string().min(2).max(40).default('CUSTOM'),
})

export const GET = withErrorHandler(async () => {
  await requirePermission(ADDITIONAL_PERMISSION_KEYS.MANAGE_RBAC)
  const permissions = await prismaUnfiltered.permission.findMany({
    orderBy: [{ category: 'asc' }, { key: 'asc' }],
  })
  return apiSuccess(permissions)
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const actor = await requirePermission(ADDITIONAL_PERMISSION_KEYS.MANAGE_RBAC)
  const body = createSchema.parse(await req.json())

  const existing = await prismaUnfiltered.permission.findUnique({ where: { key: body.key } })
  if (existing) return apiError('Permission key already exists', 409)

  const created = await prismaUnfiltered.permission.create({
    data: { ...body, isSystem: false },
  })

  await createAuditLog({
    userId: actor.id,
    action: 'CREATE',
    entity: 'Permission',
    entityId: created.key,
    description: `Permission ${created.key} created`,
    changes: { after: created },
  })
  invalidateAllPermissions()
  return apiCreated(created)
})
