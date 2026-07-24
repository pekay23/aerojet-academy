import 'server-only'
import dotenv from 'dotenv'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

/**
 * DATABASE BASE LAYER (Raw Client)
 *
 * Uses a simple lazy singleton pattern. DATABASE_URL should be set via
 * Vercel dashboard environment variables. Falls back to .env.production
 * as a safety net.
 */

// Try loading .env.production using multiple paths as fallbacks
if (process.env.NODE_ENV === 'production') {
  const paths = [
    path.resolve(process.cwd(), '.env.production'),
    path.resolve(process.cwd(), '..', '.env.production'),
  ]
  for (const p of paths) {
    dotenv.config({ path: p })
  }
}

// ── Adapter factories ──

function createPgAdapter(connectionString: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaPg } = require('@prisma/adapter-pg')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Pool } = require('pg')

  const pool = new Pool({
    connectionString,
    max: 8,
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  })

  pool.on('error', (err: Error) => {
    console.error('[DB_BASE] Unexpected error on idle client:', err.message)
  })

  return new PrismaPg(pool)
}

function createLocalNeonAdapter(connectionString: string) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaNeon } = require('@prisma/adapter-neon')
  return new PrismaNeon({ connectionString })
}

// ── Client singleton ──

const globalForPrismaBase = globalThis as unknown as {
  prismaBase: PrismaClient | undefined
}

let _client: PrismaClient | undefined

function getClient(): PrismaClient {
  if (_client) return _client

  const isDev = process.env.NODE_ENV === 'development'
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'
  const isProd = process.env.NODE_ENV === 'production'

  const dbConnectionString = isDev
    ? process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL || process.env.DIRECT_URL
    : process.env.DATABASE_URL || process.env.DIRECT_URL

  // Proxy fallback when no connection string
  if (!dbConnectionString) {
    if (isBuildTime || isProd) {
      const proxy = new Proxy({} as PrismaClient, {
        get(_target, prop) {
          if (prop === '$connect' || prop === '$disconnect') return async () => {}
          throw new Error(
            '[DB_BASE] DATABASE_URL not set. Add it in Vercel dashboard → Settings → Environment Variables.'
          )
        },
      })
      _client = proxy
      return proxy
    }
    throw new Error('[DB_BASE] DATABASE_URL is missing.')
  }

  const isNeonConnection = new URL(
    dbConnectionString.replace('postgresql://', 'postgres://')
  ).hostname.endsWith('.neon.tech')

  const isVercel = Boolean(process.env.VERCEL)
  const useLocalNeonAdapter = isDev && !isVercel && isNeonConnection

  const adapter = useLocalNeonAdapter
    ? createLocalNeonAdapter(dbConnectionString)
    : createPgAdapter(dbConnectionString)

  _client = new PrismaClient({
    adapter,
    log: isDev ? ['error', 'warn'] : ['error'],
  })

  return _client
}

export const prismaBase = globalForPrismaBase.prismaBase ?? getClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrismaBase.prismaBase = prismaBase
}

export default prismaBase
