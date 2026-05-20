import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, apiSuccess } from '@/lib/api/response'
import { requirePermission } from '@/lib/auth/permissions'
import { ADDITIONAL_PERMISSION_KEYS } from '@/lib/auth/permission-registry'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'

const schema = z.object({
  updates: z.array(
    z.object({
      id: z.string(),
      retentionDays: z.number().int().min(1).max(50 * 365),
      anchor: z.enum(['CREATED_AT', 'UPDATED_AT', 'GRADUATION']),
      isActive: z.boolean(),
      description: z.string().max(280).nullable().optional(),
    })
  ).min(1),
})

export const PATCH = withErrorHandler(async (req: NextRequest) => {
  const actor = await requirePermission(ADDITIONAL_PERMISSION_KEYS.MANAGE_GDPR)
  const body = schema.parse(await req.json())

  for (const u of body.updates) {
    const before = await prismaUnfiltered.retentionPolicy.findUnique({ where: { id: u.id } })
    if (!before) continue
    const after = await prismaUnfiltered.retentionPolicy.update({
      where: { id: u.id },
      data: {
        retentionDays: u.retentionDays,
        anchor: u.anchor,
        isActive: u.isActive,
        description: u.description ?? null,
        updatedById: actor.id,
      },
    })
    await createAuditLog({
      userId: actor.id,
      action: 'UPDATE',
      entity: 'RetentionPolicy',
      entityId: u.id,
      description: `Retention policy ${before.entity} updated`,
      changes: { before, after },
    })
  }

  return apiSuccess({ updated: body.updates.length })
})
