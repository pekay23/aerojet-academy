import { Prisma } from '@prisma/client'
import { AsyncLocalStorage } from 'async_hooks'

const rlsBypassStorage = new AsyncLocalStorage<boolean>()

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
  await client.$executeRaw(Prisma.sql`SET LOCAL ROLE app_user`)
  await client.$executeRaw(
    Prisma.sql`SELECT set_config('aerojet.user_id', ${userId}, true)`
  )

  if (userRole) {
    await client.$executeRaw(
      Prisma.sql`SELECT set_config('aerojet.user_role', ${userRole}, true)`
    )
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

        const rlsSetupQueries = [
          (baseClient as any).$executeRaw(Prisma.sql`SET LOCAL ROLE app_user`),
          (baseClient as any).$executeRaw(
            Prisma.sql`SELECT set_config('aerojet.user_id', ${userId}, true)`
          ),
          ...(userRole
            ? [
                (baseClient as any).$executeRaw(
                  Prisma.sql`SELECT set_config('aerojet.user_role', ${userRole}, true)`
                ),
              ]
            : []),
        ]

        return (baseClient as any).$transaction([...rlsSetupQueries, ...args], options)
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
          if (userRole && ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
            return query(sanitizedArgs)
          }

          if (rlsBypassStorage.getStore() === true) {
            return query(sanitizedArgs)
          }

          const modelKey = model.charAt(0).toLowerCase() + model.slice(1)

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
        if (userRole && ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(userRole)) {
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
