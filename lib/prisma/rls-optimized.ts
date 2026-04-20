import { Prisma } from '@prisma/client'
import { AsyncLocalStorage } from 'node:async_hooks'

/**
 * Prisma Extension to bridge NextAuth sessions into PostgreSQL RLS context.
 * 
 * Performance: Uses AsyncLocalStorage for recursion tracking and 
 * React.cache for request-scoped session deduplication.
 */

// Request-scoped storage to track if we're already inside an RLS transaction context
const rlsContext = new AsyncLocalStorage<{ isInternal: boolean }>();

export const rlsExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // 1. Bypass during production build (prerendering)
          if (process.env.NEXT_PHASE === 'phase-production-build') {
            return query(args);
          }

          // 2. Avoid recursion: Use AsyncLocalStorage to check if we're already inside our RLS transaction
          const context = rlsContext.getStore();
          if (context?.isInternal) {
            return query(args);
          }

          let session;
          try {
            const { getCachedSession } = await import('@/lib/auth/session-context');
            session = await getCachedSession();
          } catch (e) {
            return query(args);
          }

          const userId = session?.user?.id;
          const userRole = session?.user?.role;

          // 3. Early Bypass: If no user is authenticated, skip the transaction entirely for maximum performance
          if (!userId) {
            return query(args);
          }

          // 4. Wrap with RLS context within a transaction
          return rlsContext.run({ isInternal: true }, async () => {
            return (client as any).$transaction(async (tx: any) => {
              // Use parameterized queries for security
              await tx.$executeRaw`SELECT set_config('aerojet.user_id', ${userId}, true)`;
              if (userRole) {
                await tx.$executeRaw`SELECT set_config('aerojet.user_role', ${userRole}, true)`;
              }

              // Execute on the same transactional client to maintain session config
              return (tx as any)[model][operation](args);
            }, {
              maxWait: 10000, // Wait up to 10s for a connection from the pool
              timeout: 30000  // Allow up to 30s for the entire RLS + Query transaction
            });
          });
        },
      },
    },
  });
});
