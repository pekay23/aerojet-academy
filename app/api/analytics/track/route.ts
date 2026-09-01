import { NextRequest } from 'next/server'
import { trackSearch, trackDocumentUpload, trackPageView, trackFeatureUsage, trackReferralClick, trackEvent } from '@/lib/analytics/events'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { z } from 'zod'

const trackSchema = z.object({
  event: z.enum([
    'PAGE_VIEW',
    'REGISTRATION_STARTED',
    'FEATURE_USED',
    'SEARCH_PERFORMED',
    'DOCUMENT_UPLOADED',
    'REFERRAL_CLICKED',
    'TOUR_STARTED',
    'TOUR_COMPLETED',
    'COURSE_ACCESSED',
  ]),
  data: z.record(z.string(), z.any()),
  userId: z.string().optional(),
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json()
  const parsed = trackSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message)

  const { event, data, userId } = parsed.data

  switch (event) {
    case 'PAGE_VIEW':
      await trackPageView(data.path, userId, data.referrer)
      break
    case 'REGISTRATION_STARTED':
      await trackEvent('REGISTRATION_STARTED', {}, userId)
      break
    case 'FEATURE_USED':
      await trackFeatureUsage(data.feature, data.action, userId)
      break
    case 'SEARCH_PERFORMED':
      await trackSearch(data.query, data.resultsCount, userId)
      break
    case 'DOCUMENT_UPLOADED':
      await trackDocumentUpload(data.documentType, data.fileName, userId)
      break
    case 'REFERRAL_CLICKED':
      await trackReferralClick(data.referralCode, data.landingPage, userId)
      break
    case 'TOUR_STARTED':
      await trackEvent('TOUR_STARTED', data, userId)
      break
    case 'TOUR_COMPLETED':
      await trackEvent('TOUR_COMPLETED', data, userId)
      break
    case 'COURSE_ACCESSED':
      await trackEvent('COURSE_ACCESSED', data, userId)
      break
  }

  return apiSuccess({ tracked: true })
})
