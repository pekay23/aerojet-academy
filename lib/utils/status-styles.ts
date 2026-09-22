import { PaymentStatus } from '@prisma/client'

/**
 * Centralized status styling for consistent UI across all payment/refund/transaction components.
 * Uses semantic color tokens that work in both light and dark mode.
 */

export const PAYMENT_STATUS_STYLE: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  [PaymentStatus.APPROVED]:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  [PaymentStatus.REJECTED]: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  [PaymentStatus.PROCESSING]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  [PaymentStatus.COMPLETED]:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  [PaymentStatus.FAILED]: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  [PaymentStatus.NO_SHOW]:
    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  [PaymentStatus.CANCELLED]: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

export const REFUND_STATUS_STYLE: Record<string, string> = {
  REQUESTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  STAFF_CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ADMIN_APPROVED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  PROCESSED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

export const TRANSACTION_STATUS_STYLE: Record<string, string> = {
  // Positive/completed states
  PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  CONFIRMED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  RECONCILED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  POSTED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PROCESSED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  RELEASED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',

  // Pending/waiting states
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  RESERVED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  DUE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  POOLED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  SCHEDULED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PROCESSING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',

  // Negative/failed states
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  EXPIRED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  DECLINED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  NO_SHOW: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',

  // Neutral
  ADJUSTMENT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  REFUND: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  TOP_UP: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  CREDIT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  CAPTURE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PAYMENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
}

/**
 * Get status style with fallback
 */
export function getPaymentStatusStyle(status: PaymentStatus): string {
  return (
    PAYMENT_STATUS_STYLE[status] ??
    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
  )
}

export function getRefundStatusStyle(status: string): string {
  return (
    REFUND_STATUS_STYLE[status] ??
    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
  )
}

export function getTransactionStatusStyle(status: string): string {
  const normalized = status.toUpperCase()
  return (
    TRANSACTION_STATUS_STYLE[normalized] ??
    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
  )
}

/**
 * Status icons for accessibility - always pair color with icon
 */
export const STATUS_ICONS = {
  pending: 'Clock',
  approved: 'CheckCircle2',
  rejected: 'XCircle',
  processing: 'Loader2',
  completed: 'CheckCircle2',
  failed: 'AlertCircle',
} as const

/**
 * Human-readable status labels
 */
export const STATUS_LABELS: Record<string, string> = {
  // Payment statuses
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  NO_SHOW: 'No Show',
  CANCELLED: 'Cancelled',

  // Refund statuses
  REQUESTED: 'Requested',
  STAFF_CONFIRMED: 'Staff Confirmed',
  ADMIN_APPROVED: 'Admin Approved',
  PROCESSED: 'Processed',

  // Transaction statuses
  PAID: 'Paid',
  COMPLETED_TRANSACTION: 'Completed',
  CONFIRMED: 'Confirmed',
  POSTED: 'Posted',
  RELEASED: 'Released',
  RESERVED: 'Reserved',
  DUE: 'Due',
  POOLED: 'Pooled',
  SCHEDULED: 'Scheduled',
  PROCESSING_TRANSACTION: 'Processing',
  EXPIRED: 'Expired',
  DECLINED: 'Declined',
  NO_SHOW_TRANSACTION: 'No Show',
  ADJUSTMENT: 'Adjustment',
  TOP_UP: 'Top-up',
  CREDIT: 'Credit',
  CAPTURE: 'Capture',
  PAYMENT: 'Payment',
}
