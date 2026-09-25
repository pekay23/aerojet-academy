import 'server-only'
import { withErrorHandler, apiSuccess, apiTooManyRequests } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/helpers'
import { heartbeatPrisma } from '@/lib/prisma/heartbeat-client'
import { rateLimitAsync } from '@/lib/security/rate-limit'

/**
 * Lightweight "I'm still here" ping. The client pokes this every ~30s while
 * an authenticated session has an open tab, updating `User.lastSeenAt`.
 * Peers querying presence see "online" when this timestamp is fresh.
 *
 * Graceful DB failure: returns successful lightweight response while preserving auth.
 * The heartbeat should never fail the client's presence tracking due to transient DB issues.
 *
 * Rate limiting: 5 requests per 60 seconds per user to allow normal multi-tab use.
 * Exceeding this returns 429 to prevent abuse while not interfering with legitimate usage.
 */
export const POST = withErrorHandler(async () => {
  const user = await requireAuth()

  let rateLimitAllowed = true
  try {
    const rl = await rateLimitAsync(`user:${user.id}`, 5, 60_000)
    rateLimitAllowed = rl.allowed
  } catch (rateLimitError) {
    const message = rateLimitError instanceof Error ? rateLimitError.message : '[Unknown error]'
    const code =
      rateLimitError instanceof Error && 'code' in rateLimitError
        ? String((rateLimitError as NodeJS.ErrnoException).code ?? 'UNKNOWN')
        : 'UNKNOWN'
    console.error('[HEARTBEAT] Rate limit check failed (non-fatal):', { code, message })
  }

  if (!rateLimitAllowed) {
    return apiTooManyRequests(
      'Heartbeat rate limit exceeded. Please wait before sending more heartbeats.'
    )
  }

  try {
    await heartbeatPrisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    })
  } catch (dbError) {
    // Sanitized error logging — never pass raw error objects or stacks
    const message = dbError instanceof Error ? dbError.message : '[Unknown error]'
    const code =
      dbError instanceof Error && 'code' in dbError
        ? String((dbError as NodeJS.ErrnoException).code ?? 'UNKNOWN')
        : 'UNKNOWN'
    console.error('[HEARTBEAT] Database update failed (non-fatal):', { code, message })
    // Graceful degradation: return success to preserve auth/presence tracking
    // The client will retry on next interval; auth remains valid
  }

  return apiSuccess({ ok: true })
})
