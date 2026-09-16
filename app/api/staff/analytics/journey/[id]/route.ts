import { withErrorHandler, apiSuccess, apiError } from '@/lib/api/response'
import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { getUserJourney } from '@/lib/analytics/queries'

export const GET = withErrorHandler(async (req, ctx) => {
  await requireStaff()
  const userId = ctx?.params?.id

  if (!userId) {
    return apiError('User ID is required', 400)
  }

  const events = await getUserJourney(userId)
  return apiSuccess({ events })
})
