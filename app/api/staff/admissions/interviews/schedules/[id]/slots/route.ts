import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler , RouteContext } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'

const schema = z.object({
  date: z.string().datetime(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  capacity: z.number().min(1).default(1),
  location: z.string().optional(),
  notes: z.string().optional(),
})

export const POST = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  await requireStaff()
  const { id } = (await ctx!.params) as { id: string }
  
  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) return apiError('Invalid input')

  const { date, startTime, endTime, capacity, location, notes } = result.data

  const schedule = await prismaUnfiltered.interviewSchedule.findUnique({ where: { id } })
  if (!schedule) return apiError('Schedule not found', 404)

  const slot = await prismaUnfiltered.interviewSlot.create({
    data: {
      scheduleId: id,
      date: new Date(date),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      capacity,
      location,
      notes,
    }
  })

  return apiSuccess(slot)
})
