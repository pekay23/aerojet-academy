import { format, formatDistanceToNow, isAfter, isBefore, addDays, differenceInDays, parseISO } from 'date-fns'
import { TZDate } from '@date-fns/tz'
import { getSystemSettings } from '@/lib/settings'

// ── Format mapping: user-facing format → date-fns token ─────────────

const FORMAT_MAP: Record<string, string> = {
  'DD/MM/YYYY': 'dd/MM/yyyy',
  'MM/DD/YYYY': 'MM/dd/yyyy',
  'YYYY-MM-DD': 'yyyy-MM-dd',
  'DD-MMM-YYYY': 'dd-MMM-yyyy',
}

const DATETIME_FORMAT_MAP: Record<string, string> = {
  'DD/MM/YYYY': 'dd/MM/yyyy, HH:mm',
  'MM/DD/YYYY': 'MM/dd/yyyy, HH:mm',
  'YYYY-MM-DD': 'yyyy-MM-dd, HH:mm',
  'DD-MMM-YYYY': 'dd-MMM-yyyy, HH:mm',
}

// ── Date config from system settings ────────────────────────────────

export async function getDateConfig() {
  const settings = await getSystemSettings(['timezone', 'date_format'])
  const rawFormat = settings.get('date_format') || 'DD/MM/YYYY'
  return {
    timezone: settings.get('timezone') || 'Africa/Accra',
    dateFormat: FORMAT_MAP[rawFormat] || 'dd/MM/yyyy',
    dateTimeFormat: DATETIME_FORMAT_MAP[rawFormat] || 'dd/MM/yyyy, HH:mm',
  }
}

// ── Synchronous helpers (use hardcoded format, for client components) ─

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

// ── Async helpers (timezone + format aware, for server components) ───

export async function formatDateTz(date: Date | string): Promise<string> {
  const { timezone, dateFormat } = await getDateConfig()
  const d = typeof date === 'string' ? parseISO(date) : date
  const tzDate = new TZDate(d, timezone)
  return format(tzDate, dateFormat)
}

export async function formatDateTimeTz(date: Date | string): Promise<string> {
  const { timezone, dateTimeFormat } = await getDateConfig()
  const d = typeof date === 'string' ? parseISO(date) : date
  const tzDate = new TZDate(d, timezone)
  return format(tzDate, dateTimeFormat)
}

// ── Utility functions (unchanged) ───────────────────────────────────

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
