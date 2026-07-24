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

// ── Build-time stub ──

/**
 * Creates a recursive proxy that allows arbitrary property access
 * (for module evaluation during build) but throws when a query method
 * is actually invoked.
 */
function createBuildTimeStub(): PrismaClient {
  const ERR_MSG =
    '[DB_BASE] Prisma queries are not available during build time. DATABASE_URL must be set for runtime.'

  const throwOnQuery = () => {
    throw new Error(ERR_MSG)
  }

  /**
   * Recursive handler that returns a stub function for any property.
   * The stub function throws when called (actual query invocation).
   * But accessing properties (model names, nested fields) returns another proxy.
   */
  const createModelHandler = (): ProxyHandler<object> => ({
    get(_target, prop, _receiver) {
      // Allow `then` so stub isn't treated as a thenable/promise
      if (prop === 'then') return undefined
      // Allow symbols
      if (typeof prop === 'symbol') return undefined
      // Allow constructor/prototype
      if (prop === 'constructor' || prop === '__proto__' || prop === 'prototype') return undefined
      // Allow toString/valueOf/whatever introspection
      if (prop === 'toJSON' || prop === 'toString' || prop === 'valueOf')
        return () => '[PrismaClient Build Stub]'

      // For string property access, return a stub function that throws on invocation
      // But the stub itself also needs to support further property access
      // (e.g., prisma.user.findMany → first access `user`, then `findMany`)
      const fn = (...args: unknown[]) => {
        // $extends() returning a PrismaClient is okay — return ourselves
        if (prop === '$extends') return buildStub
        // $connect/$disconnect are no-ops during build
        if (prop === '$connect' || prop === '$disconnect') return
        // $use/$on are no-ops during build
        if (prop === '$use' || prop === '$on') return buildStub
        // $transaction: if called with a function, execute it; otherwise return array
        if (prop === '$transaction') {
          if (args.length === 1 && typeof args[0] === 'function') {
            return args[0](buildStub)
          }
          return Promise.resolve(args)
        }
        // Any actual Prisma query (findMany, findUnique, create, etc.) → throw
        throwOnQuery()
      }

      return new Proxy(fn, {
        apply(target, _thisArg, args) {
          return target(...args)
        },
        get(target, p) {
          // If accessing a property on the function itself (e.g., fn.then)
          if (p === 'then') return undefined
          if (typeof p === 'symbol') return undefined
          // Return another recursive stub for nested property access
          // (e.g., prisma.user.findMany({ where: { ... } }) → `user` returns a proxy,
          //  `findMany` returns a proxy, calling it (args) triggers throw)
          return target
        },
      })
    },

    apply(_target, _thisArg, _args) {
      // If someone tries to call the top-level proxy as a function
      throwOnQuery()
    },
  })

  const buildStub = new Proxy({}, createModelHandler()) as unknown as PrismaClient
  return buildStub
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
  // During build time, return a stub that allows module evaluation
  // but throws on actual query invocation
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    if (!_client) {
      _client = createBuildTimeStub()
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
