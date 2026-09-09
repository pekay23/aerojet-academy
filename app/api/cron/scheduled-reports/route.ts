import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered as prisma } from '@/lib/prisma/client'
import { env } from '@/lib/env'
import { sendEmail } from '@/lib/email/sender'
import { format } from 'date-fns'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { getBaseUrl } from '@/lib/utils/url'
import {
  gatherReportData,
  generateReportHtml,
  validateSchedule,
  validateEmails,
  isReportingDay,
} from '@/lib/reports/scheduled-report-service'

/**
 * Cron job to send scheduled financial reports to board/admin
 * Frequency: Daily at 8 AM (sends weekly on Mondays, monthly on the 1st)
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = env.CRON_SECRET

  // Authorization check
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Check if reporting is enabled
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { in: ['report_schedule', 'report_email', 'report_last_sent'] },
      },
    })

    const vals: Record<string, string> = {}
    for (const s of settings) vals[s.key] = s.value

    const schedule = (vals.report_schedule || 'off') as 'off' | 'weekly' | 'monthly'
    const email = vals.report_email || ''
    const lastSent = vals.report_last_sent ? new Date(vals.report_last_sent) : null

    // Respect the "Cancel" / "Off" request
    if (schedule === 'off') {
      return NextResponse.json({
        success: true,
        message: 'Reporting is disabled (off)',
      })
    }

    // Validate schedule value against allowed set
    if (!validateSchedule(schedule)) {
      return NextResponse.json({
        success: false,
        message: `Invalid schedule value: ${schedule}. Expected 'weekly' or 'monthly'.`,
      })
    }

    // 2. Check if it's time to send (weekly: Monday, monthly: 1st of month)
    const now = new Date()

    // Allow ?force=true for manual testing
    if (!isReportingDay(schedule, now) && req.nextUrl.searchParams.get('force') !== 'true') {
      return NextResponse.json({
        success: true,
        message: `Not a reporting day (schedule=${schedule})`,
      })
    }

    // Prevent double sending on the same day
    if (lastSent && format(lastSent as Date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')) {
      return NextResponse.json({
        success: true,
        message: 'Report already sent today',
      })
    }

    if (!email) {
      return NextResponse.json({
        success: false,
        message: 'No recipient email configured for reports',
      })
    }

    // Validate comma-separated email addresses
    let recipients: string[]
    try {
      recipients = validateEmails(email)
    } catch (err) {
      return NextResponse.json({
        success: false,
        message: (err as Error).message,
      })
    }

    // 3. Gather Data
    const reportData = await gatherReportData(now)
    const baseUrl = await getBaseUrl()

    // 4. Generate Email HTML
    const html = generateReportHtml(reportData, { schedule, recipients, now, baseUrl })

    // 5. Send email (must succeed before committing the timestamp)
    const emailResult = await sendEmail({
      to: recipients,
      subject: `Board Insights Report - ${format(now, 'dd MMM yyyy')}`,
      html,
      template: 'scheduled-report',
    })

    if (!emailResult.success) {
      // Record the error so admins can triage; leave report_last_sent unset so
      // the next scheduled cron run (Monday/weekly or 1st/monthly) will retry.
      await prisma.systemSetting.upsert({
        where: { key: 'report_last_error' },
        update: { value: emailResult.error || 'Unknown error' },
        create: {
          key: 'report_last_error',
          value: emailResult.error || 'Unknown error',
          type: 'STRING',
        },
      })

      await createAuditLog({
        action: AuditAction.SYSTEM_UPDATE,
        description: `Scheduled report FAILED (${schedule}) — see report_last_error setting`,
        changes: {
          schedule,
          recipientCount: recipients.length,
          reportDate: format(now, 'yyyy-MM-dd'),
          error: emailResult.error,
        },
      })

      return NextResponse.json({
        success: false,
        message: `Report delivery failed: ${emailResult.error || 'Unknown error'}`,
      })
    }

    // 6. Email delivered — commit the timestamp (deduplicates future runs)
    await prisma.systemSetting.upsert({
      where: { key: 'report_last_sent' },
      update: { value: now.toISOString() },
      create: { key: 'report_last_sent', value: now.toISOString(), type: 'STRING' },
    })

    // 7. Clear any prior error and audit-log the success
    await Promise.all([
      prisma.systemSetting.upsert({
        where: { key: 'report_last_error' },
        update: { value: '' },
        create: { key: 'report_last_error', value: '', type: 'STRING' },
      }),
      createAuditLog({
        action: AuditAction.SYSTEM_UPDATE,
        description: `Scheduled report sent (${schedule})`,
        changes: {
          schedule,
          recipientCount: recipients.length,
          reportDate: format(now, 'yyyy-MM-dd'),
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: `Report sent to ${recipients.length} recipient(s)`,
    })
  } catch (error) {
    const message = error instanceof Error ? (error as Error).message : String(error)
    console.error('[Scheduled Report Error]', message)
    return NextResponse.json(
      { success: false, error: 'Failed to generate scheduled report' },
      { status: 500 }
    )
  }
}
