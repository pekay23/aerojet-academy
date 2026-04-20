import { Prisma } from '@prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'

/**
 * Prisma Extension to bridge NextAuth sessions into PostgreSQL RLS context.
 * 
 * It automatically extracts the 'userId' and 'role' from the current session
 * and injects them into the Postgres session variables 'aerojet.user_id'
 * and 'aerojet.user_role' using a local transaction context.
 */
export const rlsExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // 1. Bypass during production build (prerendering)
          if (process.env.NEXT_PHASE === 'phase-production-build') {
            return query(args);
          }

          // 2. Avoid recursion: If this is an internal query from our own RLS transaction, 
          // or a raw execute, skip it.
          const a = args as any;
          if (a?.__isRlsInternal) {
            return query(args);
          }

          let session;
          try {
            const { getAuthSession } = await import('@/lib/auth/helpers');
            session = await getAuthSession();
          } catch (e) {
            return query(args);
          }

          const userId = session?.user?.id;
          const userRole = session?.user?.role;

          if (!userId) {
            return query(args);
          }

          // 3. Execute the query within a transaction to set session variables
          // We use the root client to initiate the transaction to ensure stability.
          return (client as any).$transaction(async (tx: any) => {
            // Set session variables using SET LOCAL (scoped to this transaction)
            await tx.$executeRawUnsafe(`SELECT set_config('aerojet.user_id', '${userId}', true)`);
            if (userRole) {
              await tx.$executeRawUnsafe(`SELECT set_config('aerojet.user_role', '${userRole}', true)`);
            }

            // Execute the original query on the transactional client
            // We pass a flag to avoid recursion if the query enters this hook again.
            const newArgs = { ...args, __isRlsInternal: true };
            return (tx as any)[model][operation](newArgs);
          });
        },
      },
    },
  });
});
