import 'server-only'
import dotenv from 'dotenv'
import path from 'node:path'
import { createRequire } from 'node:module'
import { PrismaClient } from '@prisma/client'

/**
 * DATABASE BASE LAYER (Raw Client)
 *
 * This client provides raw database access for the Identity (Auth) system.
 * Production uses the standard @prisma/adapter-pg path for Vercel stability.
 * Local development may use Neon's WebSocket adapter when TCP pg handshakes
 * stall against a remote Neon URL.
 *
 * NOTE: Next.js automatically loads .env, .env.local, .env.production during
 * build. At runtime on Vercel, env vars come from the dashboard. We also load
 * .env.production explicitly as a fallback for runtime deployments.
 */

// Load .env.production as a safety net for runtime — Vercel dashboard env vars
// take precedence since dotenv doesn't override existing env vars by default.
if (process.env.NODE_ENV === 'production') {
  const envDir = path.resolve(process.cwd())
  dotenv.config({ path: path.join(envDir, '.env.production') })
}

const require = createRequire(import.meta.url)

// ── Adapter factories (only called when client is created) ────────────

function createPgAdapter(connectionString: string) {
  const { PrismaPg } = require('@prisma/adapter-pg') as typeof import('@prisma/adapter-pg')
  const { Pool } = require('pg') as typeof import('pg')

  const isDev = process.env.NODE_ENV === 'development'

  const pool = new Pool({
    connectionString,
    max: isDev ? 5 : 8,
    connectionTimeoutMillis: isDev ? Number(process.env.DB_CONNECT_TIMEOUT_MS ?? 10000) : 60000,
    idleTimeoutMillis: isDev ? 10000 : 30000,
    allowExitOnIdle: isDev,
  })

  pool.on('error', (err: Error) => {
    console.error('[DB_BASE] Unexpected error on idle client:', err.message)
  })

  return new PrismaPg(pool)
}

function createLocalNeonAdapter(connectionString: string) {
  const { PrismaNeon } = require('@prisma/adapter-neon') as typeof import('@prisma/adapter-neon')
  return new PrismaNeon({ connectionString })
}

// ── Client singleton (lazy, all env reads inside getClient) ─────────

const globalForPrismaBase = globalThis as unknown as {
  prismaBase: PrismaClient | undefined
}

let _client: PrismaClient | undefined

function getClient(): PrismaClient {
  if (_client) return _client

  const isDev = process.env.NODE_ENV === 'development'
  const isVercel = Boolean(process.env.VERCEL)
  const localAdapterOverride = process.env.AEROJET_LOCAL_DB_ADAPTER?.toLowerCase()
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'
  const isProd = process.env.NODE_ENV === 'production'

  const dbConnectionString = isDev
    ? process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL || process.env.DIRECT_URL
    : process.env.DATABASE_URL || process.env.DIRECT_URL

  const isNeonConnection = (() => {
    if (!dbConnectionString) return false
    try {
      return new URL(dbConnectionString.replace('postgresql://', 'postgres://')).hostname.endsWith(
        '.neon.tech'
      )
    } catch {
      return false
    }
  })()

  const useLocalNeonAdapter =
    isDev &&
    !isVercel &&
    localAdapterOverride !== 'pg' &&
    (localAdapterOverride === 'neon' || isNeonConnection)

  // Production fallback when DATABASE_URL is absent
  if (isProd && !dbConnectionString) {
    const proxy = new Proxy({} as PrismaClient, {
      get(_target, prop) {
        if (prop === '$connect' || prop === '$disconnect') return async () => {}
        throw new Error(
          '[DB_BASE] DATABASE_URL not set. Configure in Vercel dashboard → Settings → Environment Variables.'
        )
      },
    })
    _client = proxy
    return proxy
  }

  // Build-time fallback
  if (isBuildTime && !dbConnectionString) {
    const proxy = new Proxy({} as PrismaClient, {
      get(_target, prop) {
        if (prop === '$connect' || prop === '$disconnect') return async () => {}
        throw new Error('[DB_BASE] DATABASE_URL missing during build.')
      },
    })
    _client = proxy
    return proxy
  }

  if (!dbConnectionString) {
    throw new Error('[DB_BASE] DATABASE_URL is missing.')
  }

  if (isDev) {
    try {
      const host = new URL(dbConnectionString.replace('postgresql://', 'http://')).hostname
      console.log(`[DB_BASE] Initializing to: ${host}`)
    } catch {
      /* ignore */
    }
  }

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
