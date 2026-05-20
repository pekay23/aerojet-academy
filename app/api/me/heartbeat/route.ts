import { withErrorHandler, apiSuccess } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'

/**
 * Lightweight "I'm still here" ping. The client pokes this every ~30s while
 * an authenticated session has an open tab, updating `User.lastSeenAt`.
 * Peers querying presence see "online" when this timestamp is fresh.
 */
export const POST = withErrorHandler(async () => {
  const user = await requireAuth()
  await prismaUnfiltered.user.update({
    where: { id: user.id },
    data: { lastSeenAt: new Date() },
  })
  return apiSuccess({ ok: true })
})
