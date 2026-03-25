import { env } from '@/lib/env'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Prisma, PrismaClient } from '@prisma/client'
import ws from 'ws'

const connectionString = env.DATABASE_URL

if (process.env.NODE_ENV === 'development') {
  const maskedUrl = connectionString.replace(/:([^:@]+)@/, ':****@')
  console.log('Prisma connecting to:', maskedUrl)
}

// In Node.js, Neon Serverless requires the ws package
neonConfig.webSocketConstructor = ws

// ---------------------------------------------------------------------------
// Soft-delete extension: automatically filters out soft-deleted rows on reads
// for models that have a `deletedAt` column. To include deleted rows, use
// `prismaUnfiltered` or pass `{ where: { deletedAt: { not: null } } }` etc.
// ---------------------------------------------------------------------------

// Models that have a `deletedAt DateTime?` column
const SOFT_DELETE_MODELS = new Set([
  'User',
  'AdminNote',
  'Enrollment',
  'Grade',
  'ExamEvent',
  'PoolMembership',
  'ExamBooking',
  'Payment',
])

type ReadOp =
  | 'findFirst'
  | 'findFirstOrThrow'
  | 'findMany'
  | 'count'
  | 'aggregate'
  | 'groupBy'

const READ_OPS: ReadOp[] = [
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
]

function softDeleteExtension() {
  return Prisma.defineExtension({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (
            model &&
            SOFT_DELETE_MODELS.has(model) &&
            READ_OPS.includes(operation as ReadOp)
          ) {
            const a = args as { where?: Record<string, unknown> }
            // Only inject if the caller hasn't explicitly filtered on deletedAt
            if (a.where === undefined || a.where === null) {
              a.where = { deletedAt: null }
            } else if (!('deletedAt' in a.where)) {
              a.where.deletedAt = null
            }
          }
          return query(args)
        },
      },
    },
  })
}

// ---------------------------------------------------------------------------

const globalForPrisma = globalThis as unknown as {
  prisma_aja: PrismaClient
  prisma_aja_ext: ReturnType<typeof createExtendedClient>
}

const createPrismaClient = () => {
  const isDev = env.NODE_ENV === 'development'

  if (!connectionString) {
    console.warn('PRISMA CLIENT INITIALIZED WITH UNDEFINED CONNECTION STRING')
  }

  const pool = new Pool({ connectionString })
  // @ts-expect-error - Prisma Neon adapter type mismatch with newer Neon serverless driver
  const adapter = new PrismaNeon(pool)

  return new PrismaClient({
    adapter,
    log: isDev ? ['query', 'error', 'warn'] : ['error'],
  })
}

const createExtendedClient = () => {
  const base = globalForPrisma.prisma_aja ?? createPrismaClient()
  if (env.NODE_ENV !== 'production') globalForPrisma.prisma_aja = base
  return base.$extends(softDeleteExtension())
}

/** Prisma client with automatic soft-delete filtering on reads. */
const extendedClient = globalForPrisma.prisma_aja_ext ?? createExtendedClient()
if (env.NODE_ENV !== 'production') globalForPrisma.prisma_aja_ext = extendedClient

// Cast to PrismaClient for type compatibility — the extension only adds runtime
// behaviour (injecting deletedAt:null into where clauses) without changing the API shape.
export const prisma = extendedClient as unknown as PrismaClient

/** Unfiltered client — use for admin queries, crons, or when you need deleted rows. */
export const prismaUnfiltered: PrismaClient =
  globalForPrisma.prisma_aja ?? createPrismaClient()
if (env.NODE_ENV !== 'production') globalForPrisma.prisma_aja = prismaUnfiltered as PrismaClient

export default prisma
