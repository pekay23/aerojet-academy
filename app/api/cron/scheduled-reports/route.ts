import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered as prisma } from '@/lib/prisma/client'
import { env } from '@/lib/env'
import { getFinanceReportSummary, getYoYComparison } from '@/lib/analytics/reports'
import { sendEmail } from '@/lib/email/sender'
import { format } from 'date-fns'

/**
 * Cron job to send scheduled financial reports to board/admin
 * Frequency: Weekly (Mondays at 8 AM)
 */
export async function GET(req: NextRequest) {
  // Feature hidden for now as per Tier 4 request
  return NextResponse.json({ success: true, message: 'Feature disabled' })

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

    const schedule = vals.report_schedule || 'off'
    const email = vals.report_email || ''
    const lastSent = vals.report_last_sent ? new Date(vals.report_last_sent) : null

    // Respect the "Cancel" / "Off" request
    if (schedule === 'off') {
      return NextResponse.json({
        success: true,
        message: 'Reporting is disabled (off)',
      })
    }

    // 2. Check if it's time to send (simple day-of-week check for weekly)
    const now = new Date()
    const isMonday = now.getDay() === 1
    
    // For manual testing or if it's actually Monday
    if (!isMonday && req.nextUrl.searchParams.get('force') !== 'true') {
      return NextResponse.json({
        success: true,
        message: 'Not a reporting day (Scheduled for Mondays)',
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

    // 3. Gather Data
    const [financeSummary, yoyData] = await Promise.all([
      getFinanceReportSummary({ year: now.getFullYear(), month: now.getMonth() + 1 }),
      getYoYComparison(now.getFullYear()),
    ])

    // 4. Generate Email HTML (Rich Dashboard style)
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <div style="background-color: #1e40af; padding: 40px 20px; border-radius: 24px 24px 0 0; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.025em;">Board Insights Report</h1>
          <p style="margin: 10px 0 0; font-size: 14px; opacity: 0.8;">Aerojet Aviation Training Academy</p>
        </div>
        
        <div style="padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 24px 24px; background-color: #ffffff;">
          <p style="font-size: 14px; color: #64748b; margin-bottom: 30px;">
            Weekly performance summary for the period ending <strong>${format(now, 'dd MMMM yyyy')}</strong>.
          </p>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #f1f5f9;">
              <p style="margin: 0; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Total Revenue (30d)</p>
              <p style="margin: 5px 0 0; font-size: 20px; font-weight: 900; color: #1e40af;">€${financeSummary.totalRevenue.toLocaleString()}</p>
            </div>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #f1f5f9;">
              <p style="margin: 0; font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Approved Payments</p>
              <p style="margin: 5px 0 0; font-size: 20px; font-weight: 900; color: #10b981;">${financeSummary.totalCount}</p>
            </div>
          </div>

          <h2 style="font-size: 16px; font-weight: 900; color: #1e40af; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.025em;">Year-on-Year Growth</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="text-align: left; font-size: 10px; color: #94a3b8; text-transform: uppercase;">
                <th style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">Metric</th>
                <th style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">${yoyData.previousYear}</th>
                <th style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">${yoyData.currentYear}</th>
                <th style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">Growth</th>
              </tr>
            </thead>
            <tbody style="font-size: 14px;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 700;">Revenue</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">€${yoyData.totals.previous.revenue.toLocaleString()}</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 900;">€${yoyData.totals.current.revenue.toLocaleString()}</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; color: #10b981; font-weight: 900;">+${Math.round((yoyData.totals.current.revenue / yoyData.totals.previous.revenue - 1) * 100)}%</td>
              </tr>
               <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 700;">Enrollments</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">${yoyData.totals.previous.enrollments}</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 900;">${yoyData.totals.current.enrollments}</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; color: #10b981; font-weight: 900;">+${Math.round((yoyData.totals.current.enrollments / yoyData.totals.previous.enrollments - 1) * 100)}%</td>
              </tr>
            </tbody>
          </table>

          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
            <a href="${env.NEXTAUTH_URL}/staff/reports" style="display: inline-block; background-color: #1e40af; color: white; padding: 12px 30px; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 14px;">View Full Dashboard</a>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <p style="font-size: 10px; color: #94a3b8;">
            You are receiving this because your email is configured as a board recipient in the Academy Portal. 
            <br/>To unsubscribe or change frequency, visit the <a href="${env.NEXTAUTH_URL}/staff/settings" style="color: #1e40af;">System Settings</a>.
          </p>
        </div>
      </div>
    `

    // 5. Send Email
    await sendEmail({
      to: email.split(',').map(e => e.trim()),
      subject: `Board Insights Report - ${format(now, 'dd MMM yyyy')}`,
      html,
    })

    // 6. Update last run timestamp
    await prisma.systemSetting.upsert({
      where: { key: 'report_last_sent' },
      update: { value: now.toISOString() },
      create: { key: 'report_last_sent', value: now.toISOString(), type: 'STRING' },
    })

    return NextResponse.json({
      success: true,
      message: `Report sent to ${email}`,
    })
  } catch (error: any) {
    console.error('[Scheduled Report Error]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
