import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { evaluateGoNoGo } from '@/lib/events/go-no-go'

/**
 * GET — Evaluate Go/No-Go for an event without executing.
 * Returns metrics, pool-by-pool breakdown, and recommendation.
 */
export const GET = withErrorHandler(
  async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
    const _admin = await requireStaff()
    const id = ctx?.params?.id
    if (!id) return apiError('Event ID required')

    const evaluation = await evaluateGoNoGo(id)
    return apiSuccess(evaluation)
  }
)
