import { Prisma } from '@prisma/client'

/**
 * Legacy RLS Extension (Noop)
 * This file is kept only to satisfy any stale bundler caches.
 * The active implementation is now in rls-hardened.ts.
 */
export const rlsExtension = Prisma.defineExtension((client) => {
  return client.$extends({});
});
