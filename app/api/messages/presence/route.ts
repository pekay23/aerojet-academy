import { NextRequest } from 'next/server'
import { withErrorHandler, apiSuccess } from '@/lib/api/response'
import { requireAuth } from '@/lib/auth/helpers'
import { resolvePresenceForViewer } from '@/lib/presence'

/**
 * Returns presence info for a list of peer user-ids, scoped to what the
 * current viewer is allowed to see. Pass peer ids via repeated `id=` query
 * params: `/api/messages/presence?id=u1&id=u2&id=u3`.
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  const viewer = await requireAuth()
  const url = new URL(req.url)
  const ids = url.searchParams.getAll('id').filter(Boolean).slice(0, 100)
  if (ids.length === 0) return apiSuccess([])

  const role = (viewer as any).role ?? 'STUDENT'
  const entries = await resolvePresenceForViewer({
    viewerId: viewer.id,
    viewerRole: role,
    peerIds: ids,
  })
  return apiSuccess(entries)
})
