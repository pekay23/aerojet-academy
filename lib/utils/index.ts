import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency to EUR
 */
export function formatCurrency(amount: number | string, currency: string = 'EUR'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount)
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

/**
 * Format date and time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/**
 * Generate unique registration code
 * Format: AERO-2026-ABC123
 */
export function generateRegistrationCode(): string {
  const year = new Date().getFullYear()
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing chars
  let code = ''
  
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return `AERO-${year}-${code}`
}

/**
 * Generate student ID
 * Format: AJA-2026-0001
 */
export function generateStudentId(sequence: number): string {
  const year = new Date().getFullYear()
  const paddedSequence = sequence.toString().padStart(4, '0')
  
  return `AJA-${year}-${paddedSequence}`
}

/**
 * Generate academy email
 * Format: firstname.m.lastname@aerojet-academy.com
 */
export function generateAcademyEmail(
  firstName: string,
  lastName: string,
  middleName?: string
): string {
  const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '')
  const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '')
  const middleInitial = middleName ? middleName.charAt(0).toLowerCase() : ''
  
  const emailName = middleInitial
    ? `${cleanFirst}.${middleInitial}.${cleanLast}`
    : `${cleanFirst}.${cleanLast}`
  
  return `${emailName}@aerojet-academy.com`
}

/**
 * Calculate available balance
 */
export function calculateAvailableBalance(
  balance: number | string,
  reservedBalance: number | string
): number {
  const bal = typeof balance === 'string' ? parseFloat(balance) : balance
  const res = typeof reservedBalance === 'string' ? parseFloat(reservedBalance) : reservedBalance
  
  return Math.max(0, bal - res)
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(email)
}

/**
 * Validate phone number (international format)
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '')
  return /^\+?[0-9]{7,15}$/.test(cleaned)
}

/**
 * Format phone number to Ghana format
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, '')
  
  if (cleaned.startsWith('+233')) {
    return cleaned
  }
  
  if (cleaned.startsWith('0')) {
    return '+233' + cleaned.substring(1)
  }
  
  return '+233' + cleaned
}

/**
 * Truncate text
 */
export function truncate(text: string, length: number = 100): string {
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Get initials from name
 */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100 * 100) / 100
}

/**
 * Check if date is in the past
 */
export function isPastDate(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  return d < new Date()
}

/**
 * Check if date is in the future
 */
export function isFutureDate(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  return d > new Date()
}

/**
 * Get days until date
 */
export function getDaysUntil(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Convert string to title case
 */
export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ')
}

/**
 * Create a slug from a string
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}