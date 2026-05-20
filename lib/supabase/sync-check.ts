/**
 * Neon ↔ Supabase replication drift sanity check.
 *
 * Counts rows on both ends for a curated set of high-value tables and reports
 * any divergence above DRIFT_THRESHOLD. Designed to be called by the
 * `/api/cron/sync-check` route on a weekly cadence (cheap query — should
 * complete well under the Vercel cron 10s budget).
 *
 * Does NOT detect row-level divergence; for that, run `pg_diff` periodically
 * out of band. This check only catches catastrophic replication breakage.
 */

import 'server-only'
import { getSupabaseAdmin, isSupabaseConfigured } from './client'
import { prismaUnfiltered } from '@/lib/prisma/client'

/** Tables we care most about — if any of these drift, alarm immediately. */
const WATCHED_TABLES = [
  'users',
  'enrollments',
  'payments',
  'audit_logs',
  'grades',
  'exam_bookings',
  'wallets',
] as const

type WatchedTable = (typeof WATCHED_TABLES)[number]

/** 0.1% drift is the alarm threshold (covers in-flight rows between counts). */
const DRIFT_THRESHOLD = 0.001

export interface TableDrift {
  table: WatchedTable
  neonCount: number
  supabaseCount: number
  diff: number
  driftPct: number
  alarmed: boolean
}

export interface SyncCheckResult {
  ran: boolean
  reason?: string
  checkedAt: string
  rows: TableDrift[]
  worstDriftPct: number
  anyAlarmed: boolean
}

async function neonCount(table: WatchedTable): Promise<number> {
  // Use $queryRawUnsafe — table names cannot be parameterised, but our values
  // are a hard-coded literal union so no injection surface exists.
  const rows = await prismaUnfiltered.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*)::bigint AS count FROM ${table}`
  )
  return Number(rows[0]?.count ?? 0)
}

async function supabaseCount(table: WatchedTable): Promise<number> {
  const supa = getSupabaseAdmin()
  if (!supa) return -1
  const { count, error } = await supa.from(table).select('*', { count: 'exact', head: true })
  if (error) throw new Error(`Supabase count failed for ${table}: ${error.message}`)
  return count ?? 0
}

export async function runSyncCheck(): Promise<SyncCheckResult> {
  if (!isSupabaseConfigured) {
    return {
      ran: false,
      reason: 'SUPABASE not configured',
      checkedAt: new Date().toISOString(),
      rows: [],
      worstDriftPct: 0,
      anyAlarmed: false,
    }
  }

  const rows: TableDrift[] = []
  for (const table of WATCHED_TABLES) {
    try {
      const [neon, supa] = await Promise.all([neonCount(table), supabaseCount(table)])
      const diff = Math.abs(neon - supa)
      const denom = Math.max(neon, 1)
      const driftPct = diff / denom
      rows.push({
        table,
        neonCount: neon,
        supabaseCount: supa,
        diff,
        driftPct,
        alarmed: driftPct > DRIFT_THRESHOLD,
      })
    } catch (err) {
      rows.push({
        table,
        neonCount: -1,
        supabaseCount: -1,
        diff: -1,
        driftPct: 1,
        alarmed: true,
      })
      console.error(`[sync-check] ${table} failed:`, err)
    }
  }

  const worstDriftPct = rows.reduce((m, r) => Math.max(m, r.driftPct), 0)
  return {
    ran: true,
    checkedAt: new Date().toISOString(),
    rows,
    worstDriftPct,
    anyAlarmed: rows.some((r) => r.alarmed),
  }
}
