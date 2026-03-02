import { PrismaPg } from '@prisma/adapter-pg'
import { Pool, defaults } from 'pg'
import { PrismaClient } from '@prisma/client'

// Ensure we have the connection string
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

// PostgreSQL SSL settings for Neon
// In development, we relax SSL verification to avoid ECONNRESET issues during TLS handshakes
const sslConfig = {
  rejectUnauthorized:
    process.env.NODE_ENV === 'production' &&
    (connectionString.includes('sslmode=verify-full') ||
      connectionString.includes('sslmode=require')),
}

const globalForPrisma = globalThis as unknown as { prisma_aja: PrismaClient }

const createPrismaClient = () => {
  // In development, we use a smaller pool size to prevent overwhelming the Neon proxy
  // with simultaneous authentication requests during cold starts (avoiding 08P01 errors)
  const isDev = process.env.NODE_ENV === 'development'

  const pool = new Pool({
    connectionString,
    ssl: sslConfig,
    max: isDev ? 3 : 20, // Further reduced in dev to prevent handshake bursts
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 90000, // Increased to 90s (extreme)
    keepAlive: true,
    allowExitOnIdle: true,
  })

  // Log pool errors for better visibility in development
  if (isDev) {
    pool.on('error', (err) => console.error('Prisma PgPool error:', err.message))
  }
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

// Global state for connection serialization during development cold starts
let isWarm = false
let connectionQueue: Promise<any> = Promise.resolve()

const basePrisma = globalForPrisma.prisma_aja ?? createPrismaClient()

// Extend the client with a connection queue for development
// This prevents multiple simultaneous handshakes during Neon cold starts (Layout + Page parallel fetch)
export const prisma =
  process.env.NODE_ENV === 'development'
    ? basePrisma.$extends({
        query: {
          $allModels: {
            async $allOperations({ args, query }) {
              if (!isWarm) {
                return (connectionQueue = connectionQueue.then(async () => {
                  const result = await query(args)
                  isWarm = true
                  return result
                }))
              }
              return query(args)
            },
          },
        },
      })
    : basePrisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma_aja = basePrisma as PrismaClient

export default prisma as unknown as PrismaClient
