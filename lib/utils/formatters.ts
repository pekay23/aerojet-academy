import {
  format,
  formatDistanceToNow,
  type FormatOptions,
  type FormatDistanceToNowOptions,
} from 'date-fns'

/**
 * Centralized date formatting utilities for consistent date/time display across the app.
 * All functions handle null/undefined gracefully and support timezone-aware formatting.
 */

export const DATE_FORMATS = {
  /** Short date: Jan 15, 2024 */
  SHORT: 'MMM d, yyyy',
  /** Medium date: January 15, 2024 */
  MEDIUM: 'MMMM d, yyyy',
  /** Long date: Monday, January 15, 2024 */
  LONG: 'EEEE, MMMM d, yyyy',
  /** Date with time: Jan 15, 2024 2:30 PM */
  DATETIME_SHORT: 'MMM d, yyyy h:mm a',
  /** Date with time (24h): Jan 15, 2024 14:30 */
  DATETIME_24H: 'MMM d, yyyy HH:mm',
  /** Time only: 2:30 PM */
  TIME_SHORT: 'h:mm a',
  /** Time only (24h): 14:30 */
  TIME_24H: 'HH:mm',
  /** ISO date for inputs: 2024-01-15 */
  ISO_DATE: 'yyyy-MM-dd',
  /** ISO datetime for inputs: 2024-01-15T14:30 */
  ISO_DATETIME: "yyyy-MM-dd'T'HH:mm",
  /** Relative: 2 hours ago, 3 days ago */
  RELATIVE: 'relative',
} as const

export type DateFormatKey = keyof typeof DATE_FORMATS

/**
 * Format a date with a predefined format or custom pattern.
 * Returns '—' for null/undefined/invalid dates.
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  formatKey: DateFormatKey = 'SHORT',
  options?: FormatOptions
): string {
  if (!date) return '—'
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return '—'

  const pattern = DATE_FORMATS[formatKey]
  if (pattern === 'relative') {
    return formatDistanceToNow(d, { addSuffix: true, ...options } as FormatDistanceToNowOptions)
  }
  return format(d, pattern, options)
}

/**
 * Format date for UK locale (DD MMM YYYY)
 */
export function formatDateUK(
  date: Date | string | number | null | undefined,
  includeTime = false
): string {
  if (!date) return '—'
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return '—'

  return format(d, includeTime ? 'd MMM yyyy HH:mm' : 'd MMM yyyy')
}

/**
 * Format date for input fields (yyyy-MM-dd)
 */
export function formatDateForInput(date: Date | string | number | null | undefined): string {
  return formatDate(date, 'ISO_DATE')
}

/**
 * Format date for datetime-local input (yyyy-MM-ddTHH:mm)
 */
export function formatDateTimeForInput(date: Date | string | number | null | undefined): string {
  return formatDate(date, 'ISO_DATETIME')
}

/**
 * Format currency with locale-aware formatting
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency = 'EUR',
  locale = 'en-GB',
  options: Intl.NumberFormatOptions = {}
): string {
  if (amount === null || amount === undefined) return '—'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '—'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(num)
}

/**
 * Format plain number with locale (no currency symbol)
 */
export function formatNumber(
  amount: number | string | null | undefined,
  locale = 'en-GB',
  options: Intl.NumberFormatOptions = {}
): string {
  if (amount === null || amount === undefined) return '—'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '—'

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(num)
}

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currency: string): string {
  try {
    return (
      new Intl.NumberFormat('en-GB', { style: 'currency', currency, minimumFractionDigits: 0 })
        .formatToParts(0)
        .find((p) => p.type === 'currency')?.value ?? currency
    )
  } catch {
    return currency
  }
}
