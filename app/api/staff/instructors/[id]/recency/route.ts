import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiError, apiCreated, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'

const ACTIVITY_TYPES = ['CLASSROOM_INSTRUCTION', 'PRACTICAL_SUPERVISION', 'UPDATE_TRAINING', 'EXAM_INVIGILATION', 'INDUSTRY_EXPERIENCE', 'OTHER'] as const

const recencySchema = z.object({
  activityType: z.enum(ACTIVITY_TYPES),
  description: z.string().min(1),
  hours: z.number().min(0.5),
  date: z.string(),
})

export const POST = withErrorHandler(async (req: NextRequest, ctx: any) => {
  await requireStaff()
  const { id } = await ctx.params
  const body = await req.json()
  const parsed = recencySchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input')

  const entry = await prismaUnfiltered.instructorRecency.create({
    data: {
      instructorId: id,
      activityType: parsed.data.activityType as any,
      description: parsed.data.description,
      hours: parsed.data.hours,
      date: new Date(parsed.data.date),
    },
  })

  return apiCreated(entry)
})
