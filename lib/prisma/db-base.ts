import 'server-only'
import { PrismaClient } from '@prisma/client'

/**
 * DATABASE BASE LAYER (Raw Client)
 *
 * Uses a simple lazy singleton pattern. DATABASE_URL must be set via
 * Vercel dashboard → Settings → Environment Variables.
 *
 * Fail-fast: if DATABASE_URL is missing, the app crashes at startup
 * rather than failing silently at the first query.
 */

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    if (process.env.VERCEL) {
      console.error(
        '[DB_BASE] ❌ DATABASE_URL is not set. Go to Vercel dashboard → Settings → Environment Variables and add DATABASE_URL.'
      )
    }
    throw new Error(
      '[DB_BASE] DATABASE_URL environment variable is required. Set it in your .env file locally, or in the Vercel dashboard for production.'
    )
  }
  return url
}

function isNeonConnection(connectionString: string): boolean {
  try {
    return new URL(connectionString.replace(/^postgres(ql)?:\/\//, 'https://')).hostname.endsWith(
      '.neon.tech'
    )
  } catch {
    return false
  }
}

function createAdapter(connectionString: string) {
  const isNeon = isNeonConnection(connectionString)
  const timeout = Number(process.env.DB_CONNECT_TIMEOUT_MS) || 10_000

  if (isNeon) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaNeon } = require('@prisma/adapter-neon')
    return new PrismaNeon({ connectionString })
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaPg } = require('@prisma/adapter-pg')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Pool } = require('pg')

  const pool = new Pool({
    connectionString,
    max: 8,
    connectionTimeoutMillis: timeout,
    idleTimeoutMillis: 30_000,
  })

  pool.on('error', (err: Error) => {
    console.error('[DB_BASE] Unexpected error on idle client:', err.message)
  })

  return new PrismaPg(pool)
}

// ── Client singleton ──

const globalForPrismaBase = globalThis as unknown as {
  prismaBase: PrismaClient | undefined
}

function getClient(): PrismaClient {
  const connectionString = getDatabaseUrl()
  const adapter = createAdapter(connectionString)
  const isDev = process.env.NODE_ENV === 'development'

  return new PrismaClient({
    adapter,
    log: isDev ? ['error', 'warn'] : ['error'],
  })
}

let _client: PrismaClient | undefined

function getOrCreateClient(): PrismaClient {
  // Build-time stub — never actually used for queries
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    if (!_client) {
      _client = new Proxy({} as PrismaClient, {
        get(_target, prop) {
          if (prop === '$connect' || prop === '$disconnect') return async () => {}
          if (prop === 'then') return undefined // not a promise
          throw new Error(
            '[DB_BASE] Prisma queries are not available during build time. DATABASE_URL must be set for runtime.'
          )
        },
      })
    }
    return _client
  }

  return getClient()
}

export const prismaBase = globalForPrismaBase.prismaBase ?? getOrCreateClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrismaBase.prismaBase = prismaBase
}

export default prismaBase
