import 'server-only'

/**
 * Soft-delete utilities for Prisma queries.
 *
 * NOTE: The default `prisma` client (from lib/prisma/client) already
 * auto-injects `deletedAt: null` on all read operations for soft-deletable
 * models via a Prisma Client Extension. You only need `notDeleted()` if
 * you are building a where clause for a raw query or need explicit control.
 *
 * Use `softDeleteData()` as the `data` argument for update calls that
 * replace hard deletes.
 */

/** Merges `{ deletedAt: null }` into an existing Prisma where clause. */
export function notDeleted<T extends Record<string, unknown>>(
  where: T
): T & { deletedAt: null } {
  return { ...where, deletedAt: null }
}

/** Returns `{ deletedAt: new Date() }` — use as `data` in update/updateMany. */
export function softDeleteData() {
  return { deletedAt: new Date() }
}
