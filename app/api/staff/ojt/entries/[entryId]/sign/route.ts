import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { apiSuccess, apiError, withErrorHandler, RouteContext } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { z } from 'zod'
import { rateLimitByUser } from '@/lib/security/rate-limit'

const signSchema = z.object({
  comments: z.string().optional().nullable(),
})

export const POST = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  const staff = await requireStaff()
  const rl = rateLimitByUser(staff.id, 30, 60000)
  if (!rl.allowed) {
    return apiError('Too many requests', 429)
  }
  const resolvedParams = await ctx?.params
  if (!resolvedParams?.entryId) return apiError('Entry ID required')
  const entryId = String(resolvedParams.entryId)
  const body = await req.json()
  const parsed = signSchema.safeParse(body)

  const entry = await prismaUnfiltered.oJTLogbookEntry.findUnique({
    where: { id: entryId },
    select: { id: true, supervisorSignature: true },
  })

  if (!entry) return apiError('Entry not found', 404)
  if (entry.supervisorSignature) return apiError('Already signed by supervisor', 400)

  const updated = await prismaUnfiltered.oJTLogbookEntry.update({
    where: { id: entryId },
    data: {
      supervisorSignature: true,
      supervisorSignedAt: new Date(),
      supervisorId: staff.id,
      supervisorComments: parsed.success ? parsed.data.comments || null : null,
    },
  })

  await createAuditLog({
    userId: staff.id,
    action: AuditAction.UPDATE,
    entity: 'OJTLogbookEntry',
    entityId: entryId,
    description: 'Supervisor signed OJT entry',
    changes: { supervisorSigned: true, comments: parsed.success ? parsed.data.comments : null },
  })

  return apiSuccess(updated)
})
