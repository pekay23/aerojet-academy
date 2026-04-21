import { PrismaClient } from '@prisma/client'
import { prismaBase } from './db-base'
import { softDeleteExtension } from './soft-delete-extension'
import { rlsExtension } from './rls-hardened'

/**
 * SECURE DATABASE LAYER (Extended Client)
 * 
 * This client includes RLS security and Soft-Delete logic.
 */

const createExtendedClient = () => {
  if (!prismaBase) {
    throw new Error('prismaBase is undefined. Check db-base.ts and database connection.');
  }
  
  const clientWithSoftDelete = prismaBase.$extends(softDeleteExtension())
  return clientWithSoftDelete.$extends(rlsExtension(clientWithSoftDelete))
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = (globalForPrisma.prisma ?? createExtendedClient()) as unknown as PrismaClient

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Re-export the base client as 'prismaUnfiltered'
export const prismaUnfiltered = prismaBase

export default prisma
