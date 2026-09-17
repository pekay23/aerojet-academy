import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireAdmin } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { rateLimitByIPAsync } from '@/lib/security/rate-limit'
import {
  gatherReportData,
  generateReportHtml,
  validateSchedule,
} from '@/lib/reports/scheduled-report-service'
import type { ScheduleType } from '@/lib/reports/scheduled-report-service'
import { getBaseUrl } from '@/lib/utils/url'

/**
 * GET /api/staff/settings/report-preview
 *
 * Generates a preview of the Board Insights Report email HTML without
 * actually sending it. Works regardless of whether the schedule is
 * enabled — the preview shows what the report would look like when
 * the cron sends it.
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin()

  // Rate limit: max 10 previews per IP per minute
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const { allowed } = await rateLimitByIPAsync(ip, 10, 60_000)
  if (!allowed) {
    return apiError('Too many preview requests. Please wait a moment.', 429)
  }

  const settings = await prismaUnfiltered.systemSetting.findMany({
    where: { key: { in: ['report_schedule', 'report_email'] } },
  })
  const vals: Record<string, string> = {}
  for (const s of settings) vals[s.key] = s.value

  const rawSchedule = vals.report_schedule || 'off'

  // For preview, default to 'monthly' if schedule is 'off' or invalid — the
  // admin is previewing the report format, not verifying the schedule state.
  let schedule: ScheduleType = 'monthly'
  const validated = validateSchedule(rawSchedule)
  if (validated && validated !== 'off') {
    schedule = validated
  }

  const now = new Date()
  const reportData = await gatherReportData(now)
  const baseUrl = await getBaseUrl()

  // Recipients are only needed if we're re-validating emails; for the
  // preview we generate without sending, so pass an empty array.
  const html = generateReportHtml(reportData, { schedule, recipients: [], now, baseUrl })

  // Return only the HTML — never expose PII (recipient emails) or financial
  // aggregates (reportData) in the API response.
  return apiSuccess({ html })
})
