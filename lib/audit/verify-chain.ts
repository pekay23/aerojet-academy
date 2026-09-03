import 'server-only'
import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import { prismaUnfiltered } from '@/lib/prisma/client'

function computeHash(
  previousHash: string | null,
  action: string,
  entityId: string | null | undefined,
  changes: Prisma.InputJsonValue,
  timestamp: string
): string {
  const data = [
    previousHash || '',
    action,
    entityId || '',
    JSON.stringify(changes || {}),
    timestamp,
  ].join('|')
  return crypto.createHash('sha256').update(data).digest('hex')
}

export interface ChainVerificationResult {
  valid: boolean
  totalEntries: number
  brokenAtIndex?: number
  brokenReason?: string
  lastValidHash?: string
}

/**
 * Verifies the integrity of the audit log hash chain.
 * Walks the chain from oldest to newest, recomputing each hash.
 */
export async function verifyAuditChain(): Promise<ChainVerificationResult> {
  const entries = await prismaUnfiltered.auditLog.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      action: true,
      entityId: true,
      changes: true,
      createdAt: true,
      previousHash: true,
      hash: true,
    },
  })

  if (entries.length === 0) {
    return { valid: true, totalEntries: 0 }
  }

  let previousHash: string | null = null

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]

    // First entry should have null previousHash
    if (i === 0) {
      if (entry.previousHash !== null) {
        return {
          valid: false,
          totalEntries: entries.length,
          brokenAtIndex: i,
          brokenReason: 'First entry must have null previousHash',
        }
      }
    } else if (entry.previousHash !== previousHash) {
      return {
        valid: false,
        totalEntries: entries.length,
        brokenAtIndex: i,
        brokenReason: `previousHash mismatch: expected ${previousHash}, got ${entry.previousHash}`,
      }
    }

    // Verify the hash was computed correctly
    const expectedHash = computeHash(
      entry.previousHash,
      entry.action,
      entry.entityId,
      entry.changes as Prisma.InputJsonValue,
      entry.createdAt.toISOString()
    )

    if (entry.hash !== expectedHash) {
      return {
        valid: false,
        totalEntries: entries.length,
        brokenAtIndex: i,
        brokenReason: `Hash mismatch at entry ${entry.id}: expected ${expectedHash}, got ${entry.hash}`,
        lastValidHash: previousHash ?? undefined,
      }
    }

    previousHash = entry.hash
  }

  return {
    valid: true,
    totalEntries: entries.length,
    lastValidHash: previousHash ?? undefined,
  }
}

/**
 * Verifies the integrity of the audit log archive hash chain.
 */
export async function verifyArchiveChain(): Promise<ChainVerificationResult> {
  const entries = await prismaUnfiltered.auditLogArchive.findMany({
    orderBy: { originalCreatedAt: 'asc' },
    select: {
      id: true,
      action: true,
      entityId: true,
      changes: true,
      originalCreatedAt: true,
      previousHash: true,
      hash: true,
    },
  })

  if (entries.length === 0) {
    return { valid: true, totalEntries: 0 }
  }

  let previousHash: string | null = null

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]

    if (i === 0) {
      if (entry.previousHash !== null) {
        return {
          valid: false,
          totalEntries: entries.length,
          brokenAtIndex: i,
          brokenReason: 'First archive entry must have null previousHash',
        }
      }
    } else if (entry.previousHash !== previousHash) {
      return {
        valid: false,
        totalEntries: entries.length,
        brokenAtIndex: i,
        brokenReason: `previousHash mismatch: expected ${previousHash}, got ${entry.previousHash}`,
      }
    }

    const expectedHash = computeHash(
      entry.previousHash,
      entry.action,
      entry.entityId,
      entry.changes as Prisma.InputJsonValue,
      entry.originalCreatedAt.toISOString()
    )

    if (entry.hash !== expectedHash) {
      return {
        valid: false,
        totalEntries: entries.length,
        brokenAtIndex: i,
        brokenReason: `Hash mismatch at archive entry ${entry.id}: expected ${expectedHash}, got ${entry.hash}`,
        lastValidHash: previousHash ?? undefined,
      }
    }

    previousHash = entry.hash
  }

  return {
    valid: true,
    totalEntries: entries.length,
    lastValidHash: previousHash ?? undefined,
  }
}
