import { withErrorHandler, apiSuccess } from '@/lib/api/response'

export const GET = withErrorHandler(async () => {
  return apiSuccess({ status: 'ok', timestamp: new Date().toISOString() })
})
