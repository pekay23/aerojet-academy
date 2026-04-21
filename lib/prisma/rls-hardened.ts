import { Prisma } from '@prisma/client'

/**
 * Prisma Extension for PostgreSQL Row Level Security.
 *
 * HOW IT WORKS:
 * - Every query is wrapped in a transaction that:
 *   1. SET LOCAL ROLE app_user  (switches from owner → non-owner so RLS applies)
 *   2. SET aerojet.user_id      (identifies the current user for policies)
 *   3. SET aerojet.user_role    (identifies the role for admin bypass policies)
 *   4. Runs the original query
 * - After the transaction, the role reverts to the owner automatically.
 * - prismaBase (used for auth) does NOT use this extension, so it operates
 *   as the table owner and bypasses RLS naturally.
 *
 * MODELS WITHOUT RLS (reference/lookup data) still go through this extension
 * but the SET LOCAL ROLE is harmless — those tables have no RLS policies.
 */

async function getSession() {
  if (process.env.NEXT_PHASE === 'phase-production-build') return null

  try {
    const { getCachedSession } = await import('@/lib/auth/session-context')
    const session = await getCachedSession()
    if (!session && process.env.NODE_ENV === 'development') {
      console.warn('[RLS] No active session — guest access.')
    }
    return session
  } catch {
    // Outside request context (startup, CLI, seed)
    return null
  }
}

export const rlsExtension = (baseClient: any) => Prisma.defineExtension({
  name: 'rlsExtensionHardened',

  // Override $transaction to inject RLS context
  client: {
    async $transaction<T>(this: T, args: any, options?: any) {
      const session = await getSession()
      const userId = session?.user?.id
      const userRole = (session as any)?.user?.role

      // No session → run transaction as owner (bypasses RLS)
      if (!userId) return (baseClient as any).$transaction(args, options)

      if (typeof args === 'function') {
        // Interactive transaction
        const originalBlock = args
        return (baseClient as any).$transaction(async (tx: any) => {
          await tx.$executeRawUnsafe(`SET LOCAL ROLE app_user`)
          await tx.$executeRaw`SELECT set_config('aerojet.user_id', ${userId}, true)`
          if (userRole) {
            await tx.$executeRaw`SELECT set_config('aerojet.user_role', ${userRole}, true)`
          }
          return originalBlock(tx)
        }, options)
      }

      // Batch transaction — prepend config queries
      const configQueries = [
        (baseClient as any).$executeRawUnsafe(`SET LOCAL ROLE app_user`),
        (baseClient as any).$executeRaw`SELECT set_config('aerojet.user_id', ${userId}, true)`,
        ...(userRole
          ? [(baseClient as any).$executeRaw`SELECT set_config('aerojet.user_role', ${userRole}, true)`]
          : []),
      ]
      return (baseClient as any).$transaction([...configQueries, ...args], options)
    },
  },

  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        // Skip during build
        if (process.env.NEXT_PHASE === 'phase-production-build') return query(args)

        const session = await getSession()
        const userId = session?.user?.id

        // No session → run as owner (bypasses RLS)
        if (!userId) return query(args)

        const userRole = (session as any)?.user?.role

        return baseClient.$transaction(
          async (tx: any) => {
            await tx.$executeRawUnsafe(`SET LOCAL ROLE app_user`)
            await tx.$executeRaw`SELECT set_config('aerojet.user_id', ${userId}, true)`
            if (userRole) {
              await tx.$executeRaw`SELECT set_config('aerojet.user_role', ${userRole}, true)`
            }
            const modelKey = model![0].toLowerCase() + model!.slice(1)
            return tx[modelKey][operation](args)
          },
          { maxWait: 15000, timeout: 30000 }
        )
      },
    },
    async $queryRaw({ args, query }) {
      const session = await getSession()
      if (!session?.user?.id) return query(args)

      return baseClient.$transaction(
        async (tx: any) => {
          await tx.$executeRawUnsafe(`SET LOCAL ROLE app_user`)
          await tx.$executeRaw`SELECT set_config('aerojet.user_id', ${session.user.id}, true)`
          const role = (session as any)?.user?.role
          if (role) await tx.$executeRaw`SELECT set_config('aerojet.user_role', ${role}, true)`
          return tx.$queryRaw(args)
        },
        { maxWait: 15000, timeout: 30000 }
      )
    },
  },
})
