import 'server-only'
import { Prisma } from '@prisma/client'
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
  | Record<string, unknown>

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

export function validatePayload(
  event: AnalyticsEventName,
  data: Record<string, unknown>
): Record<string, unknown> {
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
  entityId?: string
): Promise<void> {
  const payload = validatePayload(event, data as Record<string, unknown>)

  const resolvedUserId = userId

  // Skip user existence validation for anonymous events (no userId)
  if (resolvedUserId) {
    try {
      const userExists = await prismaUnfiltered.user.findUnique({
        where: { id: resolvedUserId },
        select: { id: true },
      })
      if (!userExists) {
        console.warn(`[ANALYTICS] Skipping event ${event}: user ${resolvedUserId} does not exist`)
        return
      }
    } catch (err) {
      // If validation fails, log but don't block the event
      console.warn(`[ANALYTICS] Could not validate user ${resolvedUserId}:`, err)
    }
  }

  try {
    await prismaUnfiltered.auditLog.create({
      data: {
        action: event,
        entity: 'ANALYTICS',
        entityId: entityId ?? resolveEntityId(event, data as Record<string, unknown>) ?? 'system',
        userId: resolvedUserId,
        changes: payload as unknown as Prisma.InputJsonValue,
      },
    })
  } catch (err) {
    // Analytics must never break the user flow
    console.error('[ANALYTICS] Failed to track event:', event, err)
  }
}

function resolveEntityId(
  event: AnalyticsEventName,
  data: Record<string, unknown>
): string | undefined {
  switch (event) {
    case 'PAGE_VIEW':
      return data.path as string | undefined
    case 'REGISTRATION_STARTED':
    case 'REGISTRATION_COMPLETED':
      return data.programmeChoice as string | undefined
    case 'PAYMENT_SUBMITTED':
    case 'PAYMENT_APPROVED':
      return data.paymentId as string | undefined
    case 'ENROLLMENT_CREATED':
      return data.enrollmentId as string | undefined
    case 'COURSE_ACCESSED':
      return data.courseId as string | undefined
    case 'EXAM_POOL_JOINED':
    case 'EXAM_COMPLETED':
      return data.poolId as string | undefined
    case 'FEATURE_USED':
      return data.feature as string | undefined
    case 'SEARCH_PERFORMED':
      return data.query as string | undefined
    case 'DOCUMENT_UPLOADED':
      return data.documentType as string | undefined
    case 'WALLET_TOP_UP':
      return (data.walletId as string | undefined) ?? 'wallet'
    case 'REFERRAL_CLICKED':
      return data.referralCode as string | undefined
    case 'TOUR_STARTED':
    case 'TOUR_COMPLETED':
      return data.tourName as string | undefined
    default:
      return undefined
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

export async function trackPayment(
  amount: number,
  currency: string,
  paymentId: string,
  userId?: string
) {
  return trackEvent('PAYMENT_APPROVED', { amount, currency, paymentId }, userId)
}

export async function trackEnrollment(
  enrollmentId: string,
  courseId: string,
  courseCode: string,
  userId?: string
) {
  return trackEvent('ENROLLMENT_CREATED', { enrollmentId, courseId, courseCode }, userId)
}

export async function trackFeatureUsage(feature: string, action?: string, userId?: string) {
  return trackEvent('FEATURE_USED', { feature, action }, userId)
}

export async function trackSearch(query: string, resultsCount?: number, userId?: string) {
  return trackEvent('SEARCH_PERFORMED', { query, resultsCount }, userId)
}

export async function trackExamCompletion(
  poolId: string,
  moduleCode: string,
  score: number,
  passed: boolean,
  userId?: string
) {
  return trackEvent('EXAM_COMPLETED', { poolId, moduleCode, score, passed }, userId)
}

export async function trackWalletTopUp(
  amount: number,
  currency: string,
  method: string,
  userId?: string
) {
  return trackEvent('WALLET_TOP_UP', { amount, currency, method }, userId)
}

export async function trackCourseAccess(courseId: string, userId?: string) {
  return trackEvent('COURSE_ACCESSED', { courseId }, userId)
}

export async function trackDocumentUpload(
  documentType: string,
  fileName?: string,
  userId?: string
) {
  return trackEvent('DOCUMENT_UPLOADED', { documentType, fileName }, userId)
}

export async function trackReferralClick(
  referralCode?: string,
  landingPage?: string,
  userId?: string
) {
  return trackEvent('REFERRAL_CLICKED', { referralCode, landingPage }, userId)
}

export async function trackPaymentSubmitted(
  amount: number,
  currency: string,
  paymentId?: string,
  userId?: string,
  method?: string
) {
  return trackEvent('PAYMENT_SUBMITTED', { amount, currency, paymentId, method }, userId)
}
