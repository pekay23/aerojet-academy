import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, apiSuccess } from '@/lib/api/response'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'

/**
 * Admin override of a user's privacy toggles. Used by the staff users page
 * so an admin can force `showLastSeen` for visibility (e.g. compliance with
 * an internal policy) or remove it for a privacy-conscious account.
 */
const schema = z.object({
  showLastSeen: z.boolean(),
})

export const PATCH = withErrorHandler(async (
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) => {
  const actor = await requireStaff()
  const { id } = await ctx.params
  const body = schema.parse(await req.json())

  const before = await prismaUnfiltered.user.findUnique({
    where: { id },
    select: { showLastSeen: true, email: true },
  })
  if (!before) return apiSuccess({ updated: 0 })

  await prismaUnfiltered.user.update({
    where: { id },
    data: { showLastSeen: body.showLastSeen },
  })
  await createAuditLog({
    userId: actor.id,
    action: 'UPDATE',
    entity: 'User',
    entityId: id,
    description: `showLastSeen ${before.showLastSeen} → ${body.showLastSeen} (admin override) for ${before.email}`,
    changes: { before, after: { showLastSeen: body.showLastSeen } },
  })

  return apiSuccess({ showLastSeen: body.showLastSeen })
})
