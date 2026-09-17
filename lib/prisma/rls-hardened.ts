import 'server-only'
import { Prisma, PrismaClient } from '@prisma/client'
import { AsyncLocalStorage } from 'async_hooks'

const rlsBypassStorage = new AsyncLocalStorage<boolean>()

type RlsModelKey = string

// Prisma's dynamic transaction argument shapes are intentionally loose; the real type
// guarantees come from the model/operation pair at runtime. Using `unknown` here forces
// every consumer to narrow before use, which is what we want at this extension boundary.
type TransactionArgs = unknown
type TransactionOptions = { maxWait?: number; timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel }

// Request-scoped RLS transaction context.
// When set, queries reuse the existing transaction instead of opening a new one per query.
interface RlsTxContext {
  tx: Prisma.TransactionClient
  userId: string
  userRole?: string
}
const rlsTxStorage = new AsyncLocalStorage<RlsTxContext>()

function stripInternalPrismaArgs<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripInternalPrismaArgs(item)) as T
  }

  if (
    value &&
    typeof value === 'object' &&
    !(value instanceof Date) &&
    !(value instanceof Uint8Array)
  ) {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !key.startsWith('__'))
      .map(([key, nestedValue]) => [key, stripInternalPrismaArgs(nestedValue)])

    return Object.fromEntries(entries) as T
  }

  return value
}

async function getSession() {
  if (process.env.NEXT_PHASE === 'phase-production-build') return null

  try {
    const { getCachedSession } = await import('@/lib/auth/session-context')
    const session = await getCachedSession()
    if (!session && process.env.NODE_ENV === 'development') {
      console.warn('[RLS] No active session - guest access.')
    }
    return session
  } catch {
    return null
  }
}

async function applyRlsContext(
  client: Prisma.TransactionClient,
  userId: string,
  userRole?: string
) {
  // Combine into a single transaction-local setup to prevent pg concurrent query warnings
  // and reduce round-trips. We use a single $executeRaw with multiple set_config calls.
  if (userRole) {
    await client.$executeRaw(Prisma.sql`
      SELECT
        set_config('role', 'app_user', true),
        set_config('aerojet.user_id', ${userId}, true),
        set_config('aerojet.user_role', ${userRole}, true)
    `)
  } else {
    await client.$executeRaw(Prisma.sql`
      SELECT
        set_config('role', 'app_user', true),
        set_config('aerojet.user_id', ${userId}, true)
    `)
  }
}

export const rlsExtension = (baseClient: PrismaClient) =>
  Prisma.defineExtension({
    name: 'rlsExtensionHardened',

    client: {
      async $transaction<T>(this: T, args: TransactionArgs, options?: TransactionOptions) {
        const session = await getSession()
        const userId = session?.user?.id
        const userRole = session?.user?.role

        if (!userId) return baseClient.$transaction(args as never, options) as unknown as T

        if (typeof args === 'function') {
          const originalBlock = args as (tx: Prisma.TransactionClient) => Promise<T>
          return baseClient.$transaction(async (tx) => {
            await applyRlsContext(tx, userId, userRole)
            return originalBlock(tx)
          }, options) as unknown as T
        }

        // For array-based transactions, we must wrap them in a callback-based transaction
        // to ensure RLS context is applied to the same connection before any other queries run.
        const arrayArgs = args as Array<{ model: string; operation: string; args: unknown }>
        return baseClient.$transaction(async (tx) => {
          await applyRlsContext(tx, userId, userRole)
          const results: unknown[] = []
          for (const query of arrayArgs) {
            const modelAccessor = (tx as unknown as Record<RlsModelKey, Record<string, (a: unknown) => Promise<unknown>>>)[query.model]
            results.push(await modelAccessor[query.operation](query.args))
          }
          return results as unknown as T
        }, options) as unknown as T
      },
    },

    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const sanitizedArgs = stripInternalPrismaArgs(args)

          const rlsModels = new Set([
            'User',
            'Profile',
            'StudentProfile',
            'StaffProfile',
            'InstructorProfile',
            'Wallet',
            'WalletTransaction',
            'Payment',
            'Invoice',
            'PaymentMilestone',
            'Enrollment',
            'FullTimeEnrollment',
            'ModularEnrollment',
            'TuitionBooking',
            'Grade',
            'AttendanceRecord',
            'ExamBooking',
            'ExamResult',
            'ExamBundle',
            'PoolMembership',
            'PoolWaitlist',
            'BookingEntitlement',
            'ExamExemption',
            'Notification',
            'Message',
            'FileUpload',
            'Referral',
            'AdminNote',
            'StudentLicenseTarget',
            'AuditLog',
          ])

          if (process.env.NEXT_PHASE === 'phase-production-build' || !rlsModels.has(model)) {
            return query(sanitizedArgs)
          }

          const session = await getSession()
          const userId = session?.user?.id
          if (!userId) return query(sanitizedArgs)

          const userRole = session?.user?.role
          if (
            userRole &&
            ['ADMIN', 'SUPER_ADMIN', 'STAFF', 'EXAMINER', 'INSTRUCTOR'].includes(userRole)
          ) {
            return query(sanitizedArgs)
          }

          if (rlsBypassStorage.getStore() === true) {
            return query(sanitizedArgs)
          }

          const modelKey = model.charAt(0).toLowerCase() + model.slice(1)

          // Reuse an existing request-scoped RLS transaction if available
          const existingCtx = rlsTxStorage.getStore()
          if (existingCtx) {
            const existingTx = existingCtx.tx as unknown as Record<string, Record<string, (a: unknown) => Promise<unknown>>>
            return existingTx[modelKey][operation](sanitizedArgs)
          }

          return rlsBypassStorage.run(true, () =>
            baseClient.$transaction(
              async (tx) => {
                await applyRlsContext(tx, userId, userRole)
                const bypassTx = tx as unknown as Record<string, Record<string, (a: unknown) => Promise<unknown>>>
                return bypassTx[modelKey][operation](sanitizedArgs)
              },
              {
                maxWait: 30000,
                timeout: 60000,
              }
            )
          )
        },
      },
      async $queryRaw({ args, query }) {
        const sanitizedArgs = stripInternalPrismaArgs(args)

        const session = await getSession()
        if (!session?.user?.id) return query(sanitizedArgs)

        const userRole = session?.user?.role
        if (
          userRole &&
          ['ADMIN', 'SUPER_ADMIN', 'STAFF', 'EXAMINER', 'INSTRUCTOR'].includes(userRole)
        ) {
          return query(sanitizedArgs)
        }

        return baseClient.$transaction(
          async (tx) => {
            await applyRlsContext(tx, session.user.id, userRole)
            return query(sanitizedArgs)
          },
          {
            maxWait: 30000,
            timeout: 60000,
          }
        )
      },
    },
  })

/**
 * Run multiple RLS-protected queries in a single transaction.
 * `set_config()` is called once, and all queries inside `fn` reuse that connection.
 * Use this in student/applicant pages to avoid per-query transaction overhead.
 *
 * @example
 * const [enrollments, grades] = await withRlsBatch(async () => {
 *   return Promise.all([
 *     prisma.enrollment.findMany({ where: { userId } }),
 *     prisma.grade.findMany({ where: { userId } }),
 *   ])
 * })
 */
export async function withRlsBatch<T>(fn: () => Promise<T>): Promise<T> {
  const session = await getSession()
  const userId = session?.user?.id
  if (!userId) return fn()

  const userRole = session?.user?.role
  if (userRole && ['ADMIN', 'SUPER_ADMIN', 'STAFF', 'EXAMINER', 'INSTRUCTOR'].includes(userRole)) {
    return fn()
  }

  const { prismaBase } = await import('./db-base')

  return prismaBase.$transaction(
    async (tx) => {
      await applyRlsContext(tx, userId, userRole)
      const ctx: RlsTxContext = { tx, userId, userRole }
      return rlsTxStorage.run(ctx, fn)
    },
    { maxWait: 30000, timeout: 60000 }
  )
}
