/**
 * Shared expiry / urgency helpers.
 *
 * Centralises the days-until and urgency-badge logic that was duplicated
 * across the staff document-vault, student documents, and instructor
 * directory pages. Thresholds are configurable so each consumer can keep
 * its own semantics without re-implementing the same arithmetic.
 */

export type UrgencyLevel = 'overdue' | 'critical' | 'urgent' | 'soon' | 'upcoming' | 'unknown'

export interface UrgencyBadge {
  label: string
  level: UrgencyLevel
  days: number | null
}

export interface UrgencyThresholds {
  critical?: number // <= N days  (default 14)
  urgent?: number // <= N days  (default 30)
  soon?: number // <= N days  (default 60)
}

const DEFAULT_THRESHOLDS: Required<UrgencyThresholds> = {
  critical: 14,
  urgent: 30,
  soon: 60,
}

/**
 * Whole days between `now` and `dateStr`. Negative = past due.
 * Mirrors `getDaysUntil` in lib/utils/index.ts (millisecond diff, ceil).
 * Returns null when the input is missing or unparseable.
 */
export function calculateDaysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null
  const diff = d.getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Map a days-until value to an urgency badge with label + level.
 * Unknown dates return the "unknown" level.
 */
export function getUrgencyBadge(
  days: number | null,
  thresholds: UrgencyThresholds = {}
): UrgencyBadge {
  const t = { ...DEFAULT_THRESHOLDS, ...thresholds }

  if (days === null) return { label: 'Unknown', level: 'unknown', days }
  if (days < 0) return { label: 'Overdue', level: 'overdue', days }
  if (days <= t.critical) return { label: 'Critical', level: 'critical', days }
  if (days <= t.urgent) return { label: 'Urgent', level: 'urgent', days }
  if (days <= t.soon) return { label: 'Soon', level: 'soon', days }
  return { label: 'Upcoming', level: 'upcoming', days }
}

/** Tailwind classes for an urgency badge, keyed by level. */
export function urgencyBadgeClasses(level: UrgencyLevel): string {
  switch (level) {
    case 'overdue':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'critical':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'urgent':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'soon':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'upcoming':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'unknown':
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
  }
}

/** Human-readable "N days" / "N days overdue" label for inline expiry text. */
export function formatExpiryDays(days: number | null): string {
  if (days === null) return ''
  if (days < 0) return `${Math.abs(days)}d overdue`
  return `${days}d`
}

/** Inline text colour for the days-until indicator (never colour-only). */
export function expiryDaysTextClass(days: number | null): string {
  if (days === null) return 'text-slate-400'
  return days < 0 ? 'text-red-600' : 'text-slate-500'
}
