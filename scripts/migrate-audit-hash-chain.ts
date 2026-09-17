import { prismaUnfiltered } from '@/lib/prisma/client'
import crypto from 'crypto'

function computeEntryHash(data: Record<string, unknown>): string {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex')
}

async function main() {
  console.log('[AUDIT_HASH_CHAIN] Starting migration...')

  const logs = await prismaUnfiltered.auditLog.findMany({
    where: { entryHash: null },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      userId: true,
      action: true,
      entity: true,
      entityId: true,
      description: true,
      changes: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
    },
  })

  console.log(`[AUDIT_HASH_CHAIN] Found ${logs.length} entries to backfill`)

  let previousHash: string | null = null
  for (const log of logs) {
    const entryHash = computeEntryHash({
      id: log.id,
      userId: log.userId || undefined,
      action: log.action,
      entity: log.entity || undefined,
      entityId: log.entityId || undefined,
      description: log.description || undefined,
      changes: log.changes || undefined,
      ipAddress: log.ipAddress || undefined,
      userAgent: log.userAgent || undefined,
      previousHash,
      createdAt: log.createdAt.toISOString(),
    })

    await prismaUnfiltered.auditLog.update({
      where: { id: log.id },
      data: {
        previousHash,
        entryHash,
      },
    })

    previousHash = entryHash
  }

  console.log(`[AUDIT_HASH_CHAIN] Backfilled ${logs.length} entries`)

  // Create immutability trigger using raw SQL via $executeRawUnsafe
  console.log('[AUDIT_HASH_CHAIN] Creating immutability trigger...')
  await prismaUnfiltered.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION deny_audit_modification()
    RETURNS TRIGGER AS $$
    BEGIN
      RAISE EXCEPTION 'audit_logs table is immutable — UPDATE/DELETE not allowed';
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
  `)

  await prismaUnfiltered.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS audit_logs_no_modify ON audit_logs;
  `)

  await prismaUnfiltered.$executeRawUnsafe(`
    CREATE TRIGGER audit_logs_no_modify
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION deny_audit_modification();
  `)

  console.log('[AUDIT_HASH_CHAIN] Migration complete')
}

main()
  .catch(err => {
    console.error('[AUDIT_HASH_CHAIN] Migration failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prismaUnfiltered.$disconnect()
  })


