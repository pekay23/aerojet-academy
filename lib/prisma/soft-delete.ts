/**
 * Soft-delete utilities for Prisma queries.
 *
 * Use `notDeleted()` to add `{ deletedAt: null }` to where clauses.
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
