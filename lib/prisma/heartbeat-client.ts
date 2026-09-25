import 'server-only'
import { createRequire } from 'module'
import { PrismaClient } from '@prisma/client'
import { createBuildTimeStub } from './build-stub'

const require = createRequire(import.meta.url)

/**
 * Heartbeat-specific Prisma client using a dedicated pg.Pool with minimal settings.
 *
 * DESIGN:
 * - Singleton PrismaPg client over pg.Pool using TCP
 * - max: 2 connections (lightweight heartbeat traffic only)
 * - idleTimeoutMillis: 10000 (10s)
 * - connectionTimeoutMillis: 5000 (5s)
 * - production SSL enabled
 * - No import from db-base/prismaUnfiltered
 * - No per-request disconnect (pool managed globally)
 * - Graceful DB failure: returns successful lightweight response while preserving auth
 */
function createHeartbeatAdapter() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('[HEARTBEAT] DATABASE_URL environment variable is required')
  }

  const { PrismaPg } = require('@prisma/adapter-pg')
  const { Pool } = require('pg')

  const ssl =
    process.env.NODE_ENV === 'development'
      ? { rejectUnauthorized: false }
      : { rejectUnauthorized: true }

  const pool = new Pool({
    connectionString,
    max: 2,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    ssl,
  })

  pool.on('error', (err: Error) => {
    if (err instanceof Error) {
      const message = err.message ?? '[No message]'
      const code = (err as NodeJS.ErrnoException).code ?? 'UNKNOWN'
      console.error('[HEARTBEAT] Pool idle client error:', { code, message })
    } else {
      console.error('[HEARTBEAT] Pool idle client error (non-Error):', { value: String(err) })
    }
  })

  return new PrismaPg(pool)
}

const globalForHeartbeat = globalThis as unknown as {
  heartbeatPrisma: PrismaClient | undefined
}

function getOrCreateHeartbeatClient(): PrismaClient {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    if (!globalForHeartbeat.heartbeatPrisma) {
      globalForHeartbeat.heartbeatPrisma = createBuildTimeStub('HEARTBEAT')
    }
    return globalForHeartbeat.heartbeatPrisma
  }

  if (!globalForHeartbeat.heartbeatPrisma) {
    const adapter = createHeartbeatAdapter()
    const client = new PrismaClient({
      adapter,
      log: ['error'],
    })

    // Structured Prisma error event handler — sanitizes output
    client.$on(
      'error',
      (e: { message?: string; code?: string; target?: string; meta?: Record<string, unknown> }) => {
        const msg = e?.message ?? '[No message in Prisma error event]'
        const code = e?.code ? ` (code: ${e.code})` : ''
        const target = e?.target ? ` (model: ${e.target})` : ''
        const meta = e?.meta ? ` meta: ${JSON.stringify(e.meta)}` : ''
        console.error(`[HEARTBEAT] Prisma error:${code}${target} ${msg}${meta}`)
      }
    )

    globalForHeartbeat.heartbeatPrisma = client
  }

  return globalForHeartbeat.heartbeatPrisma
}

export const heartbeatPrisma = getOrCreateHeartbeatClient()

if (process.env.NODE_ENV !== 'production') {
  globalForHeartbeat.heartbeatPrisma = heartbeatPrisma
}

export default heartbeatPrisma
