import { formatDate as formatDateShort, formatDateTime as formatDateTimeDefault } from './index'

export { formatDateShort as formatDate, formatDateTimeDefault as formatDateTime }

const DATE_LONG: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}

const DATE_MEDIUM: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
}

const TIME_SHORT: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
}

/** Parse a Date | string | null | undefined into a Date, or null if invalid. */
export function toDate(input: Date | string | null | undefined): Date | null {
  if (!input) return null
  const d = typeof input === 'string' ? new Date(input) : input
  return Number.isNaN(d.getTime()) ? null : d
}

/** Long-form date e.g. "1 January 2026". */
export function formatDateLong(input: Date | string | null | undefined): string {
  const d = toDate(input)
  if (!d) return 'N/A'
  return new Intl.DateTimeFormat('en-GB', DATE_LONG).format(d)
}

/** Medium-form date e.g. "01 Jan 2026". */
export function formatDateMedium(input: Date | string | null | undefined): string {
  const d = toDate(input)
  if (!d) return 'N/A'
  return new Intl.DateTimeFormat('en-GB', DATE_MEDIUM).format(d)
}

/** Date with weekday e.g. "Mon, 01 Jan 2026". */
export function formatDateWeekday(input: Date | string | null | undefined): string {
  const d = toDate(input)
  if (!d) return 'N/A'
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

/** Time only e.g. "14:30". */
export function formatTime(input: Date | string | null | undefined): string {
  const d = toDate(input)
  if (!d) return ''
  return new Intl.DateTimeFormat('en-GB', TIME_SHORT).format(d)
}

/** Relative time string e.g. "2 hours ago", "in 3 days". */
export function formatRelative(input: Date | string | null | undefined): string {
  const d = toDate(input)
  if (!d) return 'N/A'
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffSec = Math.round(diffMs / 1000)
  const absSec = Math.abs(diffSec)
  if (absSec < 60) return diffSec < 0 ? 'just now' : 'in a few seconds'
  const diffMin = Math.floor(absSec / 60)
  if (diffMin < 60) return diffSec < 0 ? `${diffMin} minute${diffMin > 1 ? 's' : ''} ago` : `in ${diffMin} minute${diffMin > 1 ? 's' : ''}`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return diffSec < 0 ? `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago` : `in ${diffHrs} hour${diffHrs > 1 ? 's' : ''}`
  const diffDays = Math.floor(diffHrs / 24)
  return diffSec < 0 ? `${diffDays} day${diffDays > 1 ? 's' : ''} ago` : `in ${diffDays} day${diffDays > 1 ? 's' : ''}`
}

/** Number of days until a date (negative if past). */
export function daysUntil(input: Date | string | null | undefined): number {
  const d = toDate(input)
  if (!d) return 0
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

/** True if the date is in the past. */
export function isPast(input: Date | string | null | undefined): boolean {
  const d = toDate(input)
  if (!d) return false
  return d.getTime() < Date.now()
}

/** True if the date is in the future. */
export function isFuture(input: Date | string | null | undefined): boolean {
  const d = toDate(input)
  if (!d) return false
  return d.getTime() > Date.now()
}

/** Add days to a date, returning a new Date. */
export function addDaysToDate(input: Date | string | null | undefined, days: number): Date {
  const d = toDate(input)
  if (!d) return new Date()
  const result = new Date(d)
  result.setDate(result.getDate() + days)
  return result
}
