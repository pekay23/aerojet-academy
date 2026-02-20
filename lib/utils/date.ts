import { format, formatDistanceToNow, isAfter, isBefore, addDays, differenceInDays, parseISO } from 'date-fns'

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd MMM yyyy')
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd MMM yyyy, HH:mm')
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function daysUntil(date: Date | string): number {
  const d = typeof date === 'string' ? parseISO(date) : date
  return differenceInDays(d, new Date())
}

export function isPast(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date
  return isBefore(d, new Date())
}

export function isFuture(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date
  return isAfter(d, new Date())
}

export function addDaysToDate(date: Date, days: number): Date {
  return addDays(date, days)
}
