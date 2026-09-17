import 'server-only'
import { prismaUnfiltered } from '@/lib/prisma/client'
import {
  DOCUMENT_BUCKET,
  isSupabaseStorageAvailable,
  uploadToStorage,
} from './supabase-storage'
import { getSupabaseAdmin } from '@/lib/supabase/client'

/**
 * Mirrors a single FileUpload row from UploadThing → Supabase storage.
 * Called by the nightly `/api/cron/supabase-mirror` reconciliation job.
 *
 * Returns:
 *   - 'mirrored' on success
 *   - 'skipped:<reason>' when not applicable
 *   - 'error:<message>' on failure (logged + counted, not thrown)
 */
export async function mirrorOne(fileUploadId: string): Promise<string> {
  const row = await prismaUnfiltered.fileUpload.findUnique({
    where: { id: fileUploadId },
  })
  if (!row) return 'skipped:not-found'
  if (row.mirroredAt) return 'skipped:already-mirrored'
  if (!row.uploadthingUrl && !row.url) return 'skipped:no-source-url'
  if (!row.supabasePath) return 'skipped:no-target-path'

  const sourceUrl = row.uploadthingUrl || row.url
  try {
    const res = await fetch(sourceUrl)
    if (!res.ok) return `error:fetch ${res.status}`
    const bytes = Buffer.from(await res.arrayBuffer())
    await uploadToStorage(row.supabasePath, bytes, row.mimeType || 'application/octet-stream')
    await prismaUnfiltered.fileUpload.update({
      where: { id: row.id },
      data: { mirroredAt: new Date() },
    })
    return 'mirrored'
  } catch (err: unknown) {
    console.error(`[uploadthing-mirror] ${fileUploadId} failed:`, err instanceof Error ? err.message : 'unknown')
    return `error:${err instanceof Error ? err.message?.slice(0, 100) : 'unknown'}`
  }
}

/**
 * Process up to `limit` unmirrored uploads in one cron tick.
 * Default 50 keeps a run under the Vercel cron 10s budget assuming ~150KB/sec
 * UT→Supabase throughput (typical Vercel Edge → us-east-1).
 */
export async function mirrorBatch(limit = 50): Promise<{
  scanned: number
  mirrored: number
  errors: string[]
  skipped: number
}> {
  if (!isSupabaseStorageAvailable()) {
    return { scanned: 0, mirrored: 0, errors: ['supabase-not-configured'], skipped: 0 }
  }
  const candidates = await prismaUnfiltered.fileUpload.findMany({
    where: { mirroredAt: null, supabasePath: { not: null } },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })

  let mirrored = 0
  let skipped = 0
  const errors: string[] = []
  for (const c of candidates) {
    const result = await mirrorOne(c.id)
    if (result === 'mirrored') mirrored += 1
    else if (result.startsWith('error')) errors.push(`${c.id}: ${result}`)
    else skipped += 1
  }
  return { scanned: candidates.length, mirrored, errors, skipped }
}

/**
 * 30-day retention sweep for temporary applicant/payment uploads that were
 * never linked to a permanent record. Keeps Supabase storage bounded.
 *
 * "Temp" = folder prefix `applicants/temp/` or `payments/temp/`. Production
 * uploads use the user's id as the second segment, so they never match.
 */
export async function sweepTempFolders(maxAgeDays = 30): Promise<{
  deleted: number
  scanned: number
  errors: string[]
}> {
  const supa = getSupabaseAdmin()
  if (!supa) return { deleted: 0, scanned: 0, errors: ['supabase-not-configured'] }

  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000
  const errors: string[] = []
  let deleted = 0
  let scanned = 0

  for (const prefix of ['applicants/temp', 'payments/temp']) {
    const { data, error } = await supa.storage.from(DOCUMENT_BUCKET).list(prefix, { limit: 1000 })
    if (error) {
      errors.push(`list ${prefix}: ${error.message}`)
      continue
    }
    if (!data) continue
    scanned += data.length
    const stale = data.filter((f) => {
      const ts = f.updated_at ? Date.parse(f.updated_at) : Date.parse(f.created_at ?? '')
      return Number.isFinite(ts) && ts < cutoff
    })
    if (stale.length === 0) continue
    const paths = stale.map((f) => `${prefix}/${f.name}`)
    const { error: delErr } = await supa.storage.from(DOCUMENT_BUCKET).remove(paths)
    if (delErr) errors.push(`remove ${prefix}: ${delErr.message}`)
    else deleted += paths.length
  }

  return { deleted, scanned, errors }
}
