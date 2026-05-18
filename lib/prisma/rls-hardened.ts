import { Prisma } from '@prisma/client'
import { AsyncLocalStorage } from 'async_hooks'

const rlsBypassStorage = new AsyncLocalStorage<boolean>()

// Request-scoped RLS transaction context.
// When set, queries reuse the existing transaction instead of opening a new one per query.
interface RlsTxContext {
  tx: any
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
  client: { $executeRaw: (...args: any[]) => Promise<unknown> },
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

export const rlsExtension = (baseClient: any) =>
  Prisma.defineExtension({
    name: 'rlsExtensionHardened',

    client: {
      async $transaction<T>(this: T, args: any, options?: any) {
        const session = await getSession()
        const userId = session?.user?.id
        const userRole = (session as any)?.user?.role

        if (!userId) return (baseClient as any).$transaction(args, options)

        if (typeof args === 'function') {
          const originalBlock = args
          return (baseClient as any).$transaction(async (tx: any) => {
            await applyRlsContext(tx, userId, userRole)
            return originalBlock(tx)
          }, options)
        }

        // For array-based transactions, we must wrap them in a callback-based transaction
        // to ensure RLS context is applied to the same connection before any other queries run.
        return (baseClient as any).$transaction(async (tx: any) => {
          await applyRlsContext(tx, userId, userRole)
          const results = []
          for (const query of args) {
            results.push(await (tx as any)[query.model][query.operation](query.args))
          }
          return results
        }, options)
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

          const userRole = (session as any)?.user?.role
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
            return existingCtx.tx[modelKey][operation](sanitizedArgs)
          }

          return rlsBypassStorage.run(true, () =>
            baseClient.$transaction(
              async (tx: any) => {
                await applyRlsContext(tx, userId, userRole)
                return tx[modelKey][operation](sanitizedArgs)
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

        const userRole = (session as any)?.user?.role
        if (
          userRole &&
          ['ADMIN', 'SUPER_ADMIN', 'STAFF', 'EXAMINER', 'INSTRUCTOR'].includes(userRole)
        ) {
          return query(sanitizedArgs)
        }

        return baseClient.$transaction(
          async (tx: any) => {
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

  const userRole = (session as any)?.user?.role
  if (userRole && ['ADMIN', 'SUPER_ADMIN', 'STAFF', 'EXAMINER', 'INSTRUCTOR'].includes(userRole)) {
    return fn()
  }

  const { prismaBase } = await import('./db-base')

  return prismaBase.$transaction(
    async (tx: any) => {
      await applyRlsContext(tx, userId, userRole)
      const ctx: RlsTxContext = { tx, userId, userRole }
      return rlsTxStorage.run(ctx, fn)
    },
    { maxWait: 30000, timeout: 60000 }
  )
}
