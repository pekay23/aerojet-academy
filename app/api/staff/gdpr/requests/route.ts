import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, apiCreated, apiPaginated } from '@/lib/api/response'
import { requirePermission } from '@/lib/auth/permissions'
import { ADDITIONAL_PERMISSION_KEYS } from '@/lib/auth/permission-registry'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'

import { DataSubjectRequestStatus } from '@prisma/client'

const createSchema = z.object({
  userId: z.string(),
  requestType: z.enum(['ACCESS', 'ERASURE', 'RECTIFICATION', 'RESTRICTION', 'PORTABILITY', 'OBJECTION']),
  notes: z.string().max(500).optional(),
})

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requirePermission(ADDITIONAL_PERMISSION_KEYS.MANAGE_GDPR)
  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200)
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const skip = (page - 1) * limit
  const status = url.searchParams.get('status') as DataSubjectRequestStatus | null

  const where = status ? { status } : {}
  const [rows, total] = await Promise.all([
    prismaUnfiltered.dataSubjectRequest.findMany({
      where,
      orderBy: [{ status: 'asc' }, { dueBy: 'asc' }],
      take: limit,
      skip,
      include: {
        user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
        assignedTo: { select: { id: true, email: true } },
      },
    }),
    prismaUnfiltered.dataSubjectRequest.count({ where }),
  ])
  return apiPaginated(rows, total, page, limit)
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const actor = await requirePermission(ADDITIONAL_PERMISSION_KEYS.MANAGE_GDPR)
  const body = createSchema.parse(await req.json())
  const dueBy = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days per GDPR Art. 12(3)

  const created = await prismaUnfiltered.dataSubjectRequest.create({
    data: { ...body, dueBy },
  })
  await createAuditLog({
    userId: actor.id,
    action: 'CREATE',
    entity: 'DataSubjectRequest',
    entityId: created.id,
    description: `${body.requestType} request opened for user ${body.userId}`,
    changes: { after: created },
  })
  return apiCreated(created)
})
