import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  intakeCycleId: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
})

export const GET = withErrorHandler(async () => {
  await requireStaff()
  const schedules = await prismaUnfiltered.interviewSchedule.findMany({
    include: {
      slots: {
        include: {
          _count: { select: { applications: true } }
        },
        orderBy: { date: 'asc' }
      },
      intakeCycle: true,
    },
    orderBy: { createdAt: 'desc' }
  })
  return apiSuccess(schedules)
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) return apiError('Invalid input')

  const { name, intakeCycleId, startDate, endDate } = result.data

  const schedule = await prismaUnfiltered.interviewSchedule.create({
    data: {
      name,
      intakeCycleId: intakeCycleId || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    }
  })

  return apiSuccess(schedule)
})
