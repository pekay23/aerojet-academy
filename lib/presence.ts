import 'server-only'
import { prismaUnfiltered } from '@/lib/prisma/client'

/** A user is considered "online" if they've sent a heartbeat in the last 90s. */
export const ONLINE_THRESHOLD_MS = 90 * 1000

export interface PresenceEntry {
  userId: string
  online: boolean
  /** Only present when the viewer is allowed to see exact last-seen. */
  lastSeenAt: string | null
}

/**
 * Resolve presence for a set of peer user-ids, applying the viewer's
 * permission to see each peer's exact last-seen timestamp.
 *
 * Rules:
 *  - `online` (true/false) is **always** visible — it's a binary heartbeat.
 *  - `lastSeenAt` (the timestamp) is visible if:
 *      * viewer is the same user as the peer, OR
 *      * viewer is staff/admin/super_admin (admins always see), OR
 *      * peer has opted-in to showing last-seen (`showLastSeen=true`).
 *  - Otherwise `lastSeenAt` is null.
 */
export async function resolvePresenceForViewer(args: {
  viewerId: string
  viewerRole: string
  peerIds: string[]
}): Promise<PresenceEntry[]> {
  if (args.peerIds.length === 0) return []

  const peers = await prismaUnfiltered.user.findMany({
    where: { id: { in: args.peerIds } },
    select: { id: true, lastSeenAt: true, showLastSeen: true },
  })

  const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'STAFF']
  const viewerIsAdmin = adminRoles.includes(args.viewerRole)
  const now = Date.now()

  return peers.map((peer) => {
    const lastSeenMs = peer.lastSeenAt?.getTime() ?? 0
    const online = lastSeenMs > 0 && now - lastSeenMs < ONLINE_THRESHOLD_MS
    const canSeeExact =
      args.viewerId === peer.id || viewerIsAdmin || peer.showLastSeen === true
    return {
      userId: peer.id,
      online,
      lastSeenAt: canSeeExact && peer.lastSeenAt ? peer.lastSeenAt.toISOString() : null,
    }
  })
}
