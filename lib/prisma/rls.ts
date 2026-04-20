import { Prisma } from '@prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'

/**
 * Prisma Extension to bridge NextAuth sessions into PostgreSQL RLS context.
 * 
 * It automatically extracts the 'userId' and 'role' from the current session
 * and injects them into the Postgres session variables 'aerojet.user_id'
 * and 'aerojet.user_role' using a local transaction context.
 */
export function rlsExtension() {
  return Prisma.defineExtension({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // 1. Bypass during production build (prerendering)
          // During 'next build', there is no user session and we should allow 
          // the system to fetch public/static data.
          if (process.env.NEXT_PHASE === 'phase-production-build') {
            return query(args);
          }

          let session;
          try {
             // Dynamic import to avoid ESM interop issues in non-Next.js environments (like tsx)
             const { getAuthSession } = await import('@/lib/auth/helpers');
             session = await getAuthSession();
          } catch (e) {
            // Not in a request context (e.g., build time fallback, cron, or background tasks)
            return query(args);
          }

          const userId = session?.user?.id;
          const userRole = session?.user?.role;

          // If we have no session, we run the query as-is.
          // RLS policies will then determine access (usually denying it unless it's a public policy).
          if (!userId) {
            return query(args);
          }

          // To use RLS policies that rely on session variables, we must use a transaction.
          // SET LOCAL ensures the variable is cleared when the transaction ends (or connection returns to pool).
          // We use the 'client' instance from the context if available.
          
          return (Prisma.getExtensionContext(this) as any).$transaction(async (tx: any) => {
            await tx.$executeRawUnsafe(`SELECT set_config('aerojet.user_id', '${userId}', true)`);
            if (userRole) {
              await tx.$executeRawUnsafe(`SELECT set_config('aerojet.user_role', '${userRole}', true)`);
            }
            return query(args);
          });
        },
      },
    },
  })
}
