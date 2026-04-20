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
          // Skip for models that don't need RLS or during unauthenticated flows 
          // where the policy allows public access (like login).
          
          let session;
          try {
             // getAuthSession relies on headers()/cookies() and can only be called in request context
             session = await getAuthSession();
          } catch (e) {
            // Not in a request context (e.g., build time, cron, or some background tasks)
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
          // We use the 'prisma' instance from the context if available, or the query context.
          
          // Note: Using a transaction for every query adds a slight overhead (one extra roundtrip for SET LOCAL).
          // However, it is the most reliable way to enforce RLS with Prisma.
          
          // We cast to any to access $transaction on the query target if needed, 
          // but Prisma extensions usually provide a way to handle this.
          
          return (Prisma as any).$transaction(async (tx: any) => {
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
