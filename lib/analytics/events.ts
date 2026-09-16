import 'server-only'
import { prismaUnfiltered } from '@/lib/prisma/client'

// ============================================================================
// Event taxonomy — canonical list of tracked events
// ============================================================================

export type AnalyticsEventName =
  | 'PAGE_VIEW'
  | 'REGISTRATION_STARTED'
  | 'REGISTRATION_COMPLETED'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_APPROVED'
  | 'ENROLLMENT_CREATED'
  | 'COURSE_ACCESSED'
  | 'EXAM_POOL_JOINED'
  | 'EXAM_COMPLETED'
  | 'FEATURE_USED'
  | 'SEARCH_PERFORMED'
  | 'DOCUMENT_UPLOADED'
  | 'WALLET_TOP_UP'
  | 'REFERRAL_CLICKED'
  | 'TOUR_STARTED'
  | 'TOUR_COMPLETED'

export type AnalyticsEntity =
  | 'PAGE'
  | 'USER'
  | 'PAYMENT'
  | 'ENROLLMENT'
  | 'COURSE'
  | 'EXAM'
  | 'FEATURE'
  | 'SEARCH'
  | 'DOCUMENT'
  | 'WALLET'
  | 'REFERRAL'
  | 'TOUR'

// ============================================================================
// Payload types for structured events
// ============================================================================

export interface PageViewPayload {
  path: string
  referrer?: string
  device?: 'mobile' | 'tablet' | 'desktop'
}

export interface RegistrationPayload {
  programmeChoice?: string
  licenseCategories?: string[]
  source?: string
}

export interface PaymentPayload {
  amount?: number
  currency?: string
  method?: string
  paymentId?: string
}

export interface EnrollmentPayload {
  enrollmentId?: string
  courseId?: string
  courseCode?: string
  enrollmentType?: string
}

export interface ExamPayload {
  poolId?: string
  moduleCode?: string
  score?: number
  passed?: boolean
}

export interface FeaturePayload {
  feature: string
  action?: string
}

export interface SearchPayload {
  query: string
  resultsCount?: number
}

export interface DocumentPayload {
  documentType: string
  fileName?: string
}

export interface WalletPayload {
  amount?: number
  currency?: string
  method?: string
}

export interface ReferralPayload {
  referralCode?: string
  landingPage?: string
}

export interface TourPayload {
  tourName: string
  stepReached?: number
  totalSteps?: number
}

export type AnalyticsPayload =
  | PageViewPayload
  | RegistrationPayload
  | PaymentPayload
  | EnrollmentPayload
  | ExamPayload
  | FeaturePayload
  | SearchPayload
  | DocumentPayload
  | WalletPayload
  | ReferralPayload
  | TourPayload
  | Record<string, any>

// ============================================================================
// Event validation
// ============================================================================

export const REQUIRED_PAYLOAD_FIELDS: Record<AnalyticsEventName, string[]> = {
  PAGE_VIEW: ['path'],
  REGISTRATION_STARTED: [],
  REGISTRATION_COMPLETED: ['programmeChoice'],
  PAYMENT_SUBMITTED: ['amount', 'currency'],
  PAYMENT_APPROVED: ['amount', 'currency', 'paymentId'],
  ENROLLMENT_CREATED: ['enrollmentId', 'courseId'],
  COURSE_ACCESSED: ['courseId'],
  EXAM_POOL_JOINED: ['poolId'],
  EXAM_COMPLETED: ['poolId'],
  FEATURE_USED: ['feature'],
  SEARCH_PERFORMED: ['query'],
  DOCUMENT_UPLOADED: ['documentType'],
  WALLET_TOP_UP: ['amount', 'currency'],
  REFERRAL_CLICKED: [],
  TOUR_STARTED: ['tourName'],
  TOUR_COMPLETED: ['tourName'],
}

export function validatePayload(event: AnalyticsEventName, data: Record<string, any>): Record<string, any> {
  const required = REQUIRED_PAYLOAD_FIELDS[event] || []
  const missing = required.filter((field) => !(field in data))
  if (missing.length > 0) {
    console.warn(`[ANALYTICS] Missing required fields for ${event}: ${missing.join(', ')}`)
  }
  return data
}

// ============================================================================
// trackEvent — fire-and-forget, never throws
// ============================================================================

export async function trackEvent(
  event: AnalyticsEventName,
  data: AnalyticsPayload = {},
  userId?: string,
): Promise<void> {
  const payload = validatePayload(event, data as Record<string, any>)

  try {
    await prismaUnfiltered.auditLog.create({
      data: {
        action: event,
        entity: 'ANALYTICS',
        entityId: 'system',
        userId: userId ?? payload.userId,
        changes: payload,
      },
    })
  } catch (err) {
    // Analytics must never break the user flow
    console.error('[ANALYTICS] Failed to track event:', event, err)
  }
}

// ============================================================================
// Convenience wrappers for common events
// ============================================================================

export async function trackPageView(path: string, userId?: string, referrer?: string) {
  return trackEvent('PAGE_VIEW', { path, referrer }, userId)
}

export async function trackRegistration(programmeChoice: string, userId?: string) {
  return trackEvent('REGISTRATION_COMPLETED', { programmeChoice }, userId)
}

export async function trackPayment(amount: number, currency: string, paymentId: string, userId?: string) {
  return trackEvent('PAYMENT_APPROVED', { amount, currency, paymentId }, userId)
}

export async function trackEnrollment(enrollmentId: string, courseId: string, courseCode: string, userId?: string) {
  return trackEvent('ENROLLMENT_CREATED', { enrollmentId, courseId, courseCode }, userId)
}

export async function trackFeatureUsage(feature: string, action?: string, userId?: string) {
  return trackEvent('FEATURE_USED', { feature, action }, userId)
}

export async function trackSearch(query: string, resultsCount?: number, userId?: string) {
  return trackEvent('SEARCH_PERFORMED', { query, resultsCount }, userId)
}

export async function trackExamCompletion(poolId: string, moduleCode: string, score: number, passed: boolean, userId?: string) {
  return trackEvent('EXAM_COMPLETED', { poolId, moduleCode, score, passed }, userId)
}

export async function trackWalletTopUp(amount: number, currency: string, method: string, userId?: string) {
  return trackEvent('WALLET_TOP_UP', { amount, currency, method }, userId)
}
