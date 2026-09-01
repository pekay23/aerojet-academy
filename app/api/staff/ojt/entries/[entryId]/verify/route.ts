import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { apiSuccess, apiError, withErrorHandler, RouteContext } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { z } from 'zod'
import { rateLimitByUser } from '@/lib/security/rate-limit'

export const POST = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  const staff = await requireStaff()
  const rl = rateLimitByUser(staff.id, 30, 60000)
  if (!rl.allowed) {
    return apiError('Too many requests', 429)
  }
  if (!ctx?.params?.entryId) return apiError('Entry ID required')
  const entryId = ctx.params.entryId

  const entry = await prismaUnfiltered.oJTLogbookEntry.findUnique({
    where: { id: entryId },
    select: { id: true, verifiedByManagement: true },
  })

  if (!entry) return apiError('Entry not found', 404)
  if (entry.verifiedByManagement) return apiError('Already verified by management', 400)

  const updated = await prismaUnfiltered.oJTLogbookEntry.update({
    where: { id: entryId },
    data: {
      verifiedByManagement: true,
      managementSignedAt: new Date(),
    },
  })

  await createAuditLog({
    userId: staff.id,
    action: AuditAction.UPDATE,
    entity: 'OJTLogbookEntry',
    entityId: entryId,
    description: 'Management verified OJT entry',
    changes: { verifiedByManagement: true },
  })

  return apiSuccess(updated)
})
