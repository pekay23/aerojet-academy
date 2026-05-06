import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { createGroupBooking } from '@/lib/pools/group-booking'
import { charterBookingSchema, validateBody } from '@/lib/validation/schemas'

export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()

  const body = await req.json()
  const validation = validateBody(charterBookingSchema, body)
  if (!validation.success) return apiError(validation.error)

  const { repUserId, eventId, groupName, memberCount, modules } = validation.data

  const result = await createGroupBooking({
    repUserId,
    eventId,
    groupName,
    memberCount,
    modules,
  })

  return apiSuccess({ poolId: result.pool.id })
})
