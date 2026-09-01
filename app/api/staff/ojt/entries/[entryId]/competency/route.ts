import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { apiSuccess, apiError, withErrorHandler, RouteContext } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { z } from 'zod'
import { rateLimitByUser } from '@/lib/security/rate-limit'
import { z } from 'zod'

const competencySchema = z.object({
  rating: z.number().int().min(1).max(5),
})

export const POST = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  const staff = await requireStaff()
  const rl = rateLimitByUser(staff.id, 30, 60000)
  if (!rl.allowed) {
    return apiError('Too many requests', 429)
  }
  if (!ctx?.params?.entryId) return apiError('Entry ID required')
  const entryId = ctx.params.entryId
  const body = await req.json()
  const parsed = competencySchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid rating', 400)

  const entry = await prismaUnfiltered.oJTLogbookEntry.findUnique({
    where: { id: entryId },
    select: { id: true },
  })

  if (!entry) return apiError('Entry not found', 404)

  const updated = await prismaUnfiltered.oJTLogbookEntry.update({
    where: { id: entryId },
    data: { competencyRating: parsed.data.rating },
  })

  await createAuditLog({
    userId: staff.id,
    action: AuditAction.UPDATE,
    entity: 'OJTLogbookEntry',
    entityId: entryId,
    description: `Competency rated ${parsed.data.rating}/5`,
    changes: { competencyRating: parsed.data.rating },
  })

  return apiSuccess(updated)
})
