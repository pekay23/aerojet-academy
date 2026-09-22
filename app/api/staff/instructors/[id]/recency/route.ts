import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiError, apiCreated, withErrorHandler, RouteContext } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { RecencyActivityType } from '@prisma/client'
import { z } from 'zod'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'

const recencySchema = z.object({
  activityType: z.enum(RecencyActivityType),
  description: z.string().min(1),
  hours: z.number().min(0.5),
  date: z.string(),
})

export const POST = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  const staff = await requireStaff()
  const { id } = (await ctx!.params) as { id: string }
  const body = await req.json()
  const parsed = recencySchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input')

  const entry = await prismaUnfiltered.instructorRecency.create({
    data: {
      instructorId: id,
      activityType: parsed.data.activityType,
      description: parsed.data.description,
      hours: parsed.data.hours,
      date: new Date(parsed.data.date),
    },
  })

  await createAuditLog({
    action: AuditAction.CREATE,
    entity: 'InstructorRecency',
    entityId: entry.id,
    userId: staff.id,
    description: `Added recency activity for instructor ${id}`,
    changes: parsed.data,
  })

  return apiCreated(entry)
})
