import { env } from '@/lib/env'
import { Prisma, PrismaClient } from '@prisma/client'
import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'

const connectionString = env.DATABASE_URL
const isDev = env.NODE_ENV === 'development'

const logPrismaConnect = () => {
  if (isDev) {
    const maskedUrl = connectionString.replace(/:([^:@]+)@/, ':****@')
    console.log('Prisma connecting to:', maskedUrl)
  }
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

const createAdapter = () => {
  // PrismaNeon@7.5 expects a config object, not a Pool instance — it creates its own Pool internally
  return new PrismaNeon({ connectionString })
}

const createPrismaClient = () => {
  if (!connectionString) {
    console.warn('PRISMA CLIENT INITIALIZED WITH UNDEFINED CONNECTION STRING')
  }

  logPrismaConnect()
  return new PrismaClient({
    adapter: createAdapter(),
    log: isDev ? ['query', 'error', 'warn'] : ['error'],
  })
}

import { rlsExtension } from './rls'

const createExtendedClient = () => {
  const base = globalForPrisma.prisma_aja ?? createPrismaClient()
  if (env.NODE_ENV !== 'production') globalForPrisma.prisma_aja = base
  
  return base
    .$extends(softDeleteExtension())
    .$extends(rlsExtension)
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
