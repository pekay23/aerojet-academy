import { NextRequest } from 'next/server'
import { requireExaminer } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { apiSuccess, apiError, apiCreated, withErrorHandler } from '@/lib/api/response'

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const user = await requireExaminer()
  const slots = await prismaUnfiltered.staffAvailability.findMany({
    where: { userId: user.id },
    orderBy: [{ kind: 'asc' }, { dayOfWeek: 'asc' }, { date: 'asc' }],
  })
  return apiSuccess(slots)
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireExaminer()
  const body = await req.json()
  const { kind, dayOfWeek, date, startTime, endTime, available, notes } = body as Record<string, unknown>

  if (!startTime || !endTime) return apiError('Start and end time are required')
  if (kind === 'RECURRING_WEEKLY' && (dayOfWeek == null || (dayOfWeek as number) < 0)) {
    return apiError('Select a day of week')
  }
  if (kind === 'SPECIFIC_DATE' && !date) return apiError('Select a date')

  const slot = await prismaUnfiltered.staffAvailability.create({
    data: {
      userId: user.id,
      kind: kind as 'RECURRING_WEEKLY' | 'SPECIFIC_DATE',
      dayOfWeek: kind === 'RECURRING_WEEKLY' ? (dayOfWeek as number) : null,
      date: kind === 'SPECIFIC_DATE' ? new Date(date as string) : null,
      startTime: startTime as string,
      endTime: endTime as string,
      available: (available as boolean | undefined) ?? true,
      notes: (notes as string | undefined)?.trim() || null,
    },
  })

  return apiCreated(slot)
})
