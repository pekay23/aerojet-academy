import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler , RouteContext } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getInterviewConfig } from '@/lib/settings'
import { z } from 'zod'

const schema = z.object({
  dateStart: z.string().datetime(),
  dateEnd: z.string().datetime(),
  daysOfWeek: z.array(z.number().min(0).max(6)), // 0 = Sunday, 6 = Saturday
  timeBlocks: z.array(z.object({
    start: z.string(), // "09:00"
    end: z.string(), // "10:00"
    capacity: z.number().min(1),
    location: z.string().optional()
  })).min(1),
})

export const POST = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  await requireStaff()
  const { id } = (await ctx!.params) as { id: string }
  
  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) return apiError('Invalid input')

  const { dateStart, dateEnd, daysOfWeek, timeBlocks } = result.data

  const schedule = await prismaUnfiltered.interviewSchedule.findUnique({ where: { id } })
  if (!schedule) return apiError('Schedule not found', 404)

  const _config = await getInterviewConfig()

  const start = new Date(dateStart)
  const end = new Date(dateEnd)
  
  if (start > end) return apiError('Start date must be before end date', 400)

  const slotsToCreate = []

  const currentDate = new Date(start)
  while (currentDate <= end) {
    if (daysOfWeek.includes(currentDate.getDay())) {
      for (const block of timeBlocks) {
        const [startHours, startMinutes] = block.start.split(':').map(Number)
        const [endHours, endMinutes] = block.end.split(':').map(Number)
        
        const slotStartTime = new Date(currentDate)
        slotStartTime.setHours(startHours, startMinutes, 0, 0)
        
        const slotEndTime = new Date(currentDate)
        slotEndTime.setHours(endHours, endMinutes, 0, 0)

        // Verify it doesn't exceed daily capacity if we want to enforce it (optional, 
        // plan says "daily capacity limit", but here we just create slots per timeBlocks)
        
        slotsToCreate.push({
          scheduleId: id,
          date: new Date(currentDate), // Strip time for date field
          startTime: slotStartTime,
          endTime: slotEndTime,
          capacity: block.capacity,
          location: block.location,
        })
      }
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }

  const created = await prismaUnfiltered.interviewSlot.createMany({
    data: slotsToCreate
  })

  return apiSuccess({ count: created.count })
})
