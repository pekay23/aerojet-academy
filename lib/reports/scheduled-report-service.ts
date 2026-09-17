import 'server-only'

import { getFinanceReportSummary, getYoYComparison } from '@/lib/analytics/reports'
import { format } from 'date-fns'

/**
 * Scheduled report generation service.
 *
 * Extracted from the cron handler so that both the cron endpoint
 * and a staff-facing preview endpoint can reuse the same HTML
 * template and data-gathering logic.
 */

export type ScheduleType = 'off' | 'weekly' | 'monthly'

export interface ReportData {
  totalRevenue: number
  totalCount: number
  previousYear: number
  currentYear: number
  totals: {
    previous: { revenue: number; enrollments: number }
    current: { revenue: number; enrollments: number }
  }
}

export interface ReportConfig {
  schedule: ScheduleType
  recipients: string[]
  now?: Date
  baseUrl?: string
}

export function validateSchedule(schedule: string): ScheduleType | null {
  if (schedule === 'off' || schedule === 'weekly' || schedule === 'monthly') {
    return schedule
  }
  return null
}

export function validateEmails(emails: string): string[] {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const recipients = emails
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
  const invalid = recipients.filter((r) => !emailRegex.test(r))
  if (invalid.length > 0) {
    throw new Error(`Invalid email address(es): ${invalid.join(', ')}`)
  }
  return recipients
}

export async function gatherReportData(now: Date): Promise<ReportData> {
  const [financeSummary, yoyData] = await Promise.all([
    getFinanceReportSummary({ year: now.getFullYear(), month: now.getMonth() + 1 }),
    getYoYComparison(now.getFullYear()),
  ])

  return {
    totalRevenue: financeSummary.totalRevenue,
    totalCount: financeSummary.totalCount,
    previousYear: yoyData.previousYear,
    currentYear: yoyData.currentYear,
    totals: yoyData.totals,
  }
}

export function safeGrowth(current: number, previous: number): string {
  if (previous <= 0) return 'N/A'
  const pct = Math.round((current / previous - 1) * 100)
  return pct >= 0 ? `+${pct}%` : `${pct}%`
}

export function isReportingDay(schedule: ScheduleType, now: Date): boolean {
  const isMonday = now.getDay() === 1
  const isFirstOfMonth = now.getDate() === 1
  return schedule === 'weekly' ? isMonday : schedule === 'monthly' ? isFirstOfMonth : false
}

/**
 * Generates the HTML for the Board Insights Report email.
 * Shared between the cron handler and the preview endpoint.
 */
export function generateReportHtml(data: ReportData, config: ReportConfig): string {
  const now = config.now || new Date()
  const period = config.schedule === 'weekly' ? 'Weekly' : 'Monthly'
  const appUrl = config.baseUrl || ''
  const logoUrl = appUrl ? `${appUrl}/images/logos/ATA_logo_hor_onDark.png` : ''

  return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <div style="background-color: #1e40af; padding: 40px 20px; border-radius: 24px 24px 0 0; text-align: center; color: white; position: relative;">
          ${logoUrl ? `<img src="${logoUrl}" alt="Aerojet Academy" width="200" style="display: block; margin: 0 auto 20px; max-width: 80%; height: auto;" />` : ''}
          <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.025em;">Board Insights Report</h1>
          <p style="margin: 10px 0 0; font-size: 14px; opacity: 0.8;">Aerojet Aviation Training Academy</p>
        </div>
        
        <div style="padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 24px 24px; background-color: #ffffff;">
          <p style="font-size: 14px; color: #64748b; margin-bottom: 30px;">
            ${period} performance summary for the period ending <strong>${format(now, 'dd MMMM yyyy')}</strong>.
          </p>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #f1f5f9;">
              <p style="margin: 0; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Total Revenue (30d)</p>
              <p style="margin: 5px 0 0; font-size: 20px; font-weight: 900; color: #1e40af;">€${data.totalRevenue.toLocaleString('en-IE')}</p>
            </div>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #f1f5f9;">
              <p style="margin: 0; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Approved Payments</p>
              <p style="margin: 5px 0 0; font-size: 20px; font-weight: 900; color: #10b981;">${data.totalCount}</p>
            </div>
          </div>

          <h2 style="font-size: 16px; font-weight: 900; color: #1e40af; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.025em;">Year-on-Year Growth</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="text-align: left; font-size: 10px; color: #94a3b8; text-transform: uppercase;">
                <th style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">Metric</th>
                <th style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">${data.previousYear}</th>
                <th style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">${data.currentYear}</th>
                <th style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">Growth</th>
              </tr>
            </thead>
            <tbody style="font-size: 14px;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 700;">Revenue</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">€${data.totals.previous.revenue.toLocaleString('en-IE')}</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 900;">€${data.totals.current.revenue.toLocaleString('en-IE')}</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; color: #10b981; font-weight: 900;">${safeGrowth(data.totals.current.revenue, data.totals.previous.revenue)}</td>
              </tr>
               <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 700;">Enrollments</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">${data.totals.previous.enrollments}</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 900;">${data.totals.current.enrollments}</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; color: #10b981; font-weight: 900;">${safeGrowth(data.totals.current.enrollments, data.totals.previous.enrollments)}</td>
              </tr>
            </tbody>
          </table>

          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
            <a href="${appUrl}/staff/reports" style="display: inline-block; background-color: #1e40af; color: white; padding: 12px 30px; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 14px;">View Full Dashboard</a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <p style="font-size: 10px; color: #94a3b8;">
            You are receiving this because your email is configured as a board recipient in the Academy Portal. 
            <br/>To unsubscribe or change frequency, visit the             <a href="${appUrl}/staff/settings" style="color: #1e40af;">System Settings</a>.
          </p>
        </div>
      </div>
    `
}
