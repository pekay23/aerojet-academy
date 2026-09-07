import prisma from '@/lib/prisma/client'
import { encrypt } from '@/lib/security/encryption'
import { EMAIL_ADDRESSES } from '@/lib/constants/business-rules'

async function encryptBackup(json: string): Promise<string> {
  return encrypt(json)
}

// All Prisma model names (camelCase delegates) with human-readable labels
export const BACKUP_MODELS = [
  { key: 'user', label: 'Users' },
  { key: 'profile', label: 'Profiles' },
  { key: 'studentProfile', label: 'Student Profiles' },
  { key: 'instructorProfile', label: 'Instructor Profiles' },
  { key: 'staffProfile', label: 'Staff Profiles' },
  { key: 'licenseCategory', label: 'License Categories' },
  { key: 'licenseModuleRequirement', label: 'License Module Requirements' },
  { key: 'studyPathwayModel', label: 'Study Pathways' },
  { key: 'academicTerm', label: 'Academic Terms' },
  { key: 'termCourseAssignment', label: 'Term Course Assignments' },
  { key: 'studentLicenseTarget', label: 'Student License Targets' },
  { key: 'examComponent', label: 'Exam Components' },
  { key: 'course', label: 'Courses' },
  { key: 'courseCategory', label: 'Course Categories' },
  { key: 'enrollment', label: 'Enrollments' },
  { key: 'class', label: 'Classes' },
  { key: 'attendanceRecord', label: 'Attendance Records' },
  { key: 'grade', label: 'Grades' },
  { key: 'examEvent', label: 'Exam Events' },
  { key: 'examPool', label: 'Exam Pools' },
  { key: 'poolMembership', label: 'Pool Memberships' },
  { key: 'poolWaitlist', label: 'Pool Waitlist' },
  { key: 'wallet', label: 'Wallets' },
  { key: 'walletTransaction', label: 'Wallet Transactions' },
  { key: 'exam', label: 'Exams' },
  { key: 'examBooking', label: 'Exam Bookings' },
  { key: 'bookingEntitlement', label: 'Booking Entitlements' },
  { key: 'examResult', label: 'Exam Results' },
  { key: 'examBundle', label: 'Exam Bundles' },
  { key: 'payment', label: 'Payments' },
  { key: 'invoice', label: 'Invoices' },
  { key: 'notification', label: 'Notifications' },
  { key: 'message', label: 'Messages' },
  { key: 'auditLog', label: 'Audit Logs' },
  { key: 'systemSetting', label: 'System Settings' },
  { key: 'paymentMethod', label: 'Payment Methods' },
  { key: 'fileUpload', label: 'File Uploads' },
  { key: 'newsArticle', label: 'News Articles' },
  { key: 'generalResource', label: 'General Resources' },
  { key: 'academicYear', label: 'Academic Years' },
  { key: 'semester', label: 'Semesters' },
  { key: 'fullTimeProgramme', label: 'Full-Time Programmes' },
  { key: 'programmeYear', label: 'Programme Years' },
  { key: 'fullTimeEnrollment', label: 'Full-Time Enrollments' },
  { key: 'ojtPeriod', label: 'OJT Periods' },
  { key: 'paymentMilestone', label: 'Payment Milestones' },
  { key: 'modularPackage', label: 'Modular Packages' },
  { key: 'modularEnrollment', label: 'Modular Enrollments' },
  { key: 'tuitionRun', label: 'Tuition Runs' },
  { key: 'tuitionBooking', label: 'Tuition Bookings' },
  { key: 'emailTemplate', label: 'Email Templates' },
  { key: 'referral', label: 'Referrals' },
] as const

export type BackupData = Record<string, unknown[]>

/**
 * Export all database tables. Returns a map of model name → records.
 */
export async function exportAllTables(): Promise<BackupData> {
  const backup: BackupData = {}

  for (const model of BACKUP_MODELS) {
    try {
      // @ts-expect-error - dynamic model access on Prisma client
      const records = await prisma[model.key].findMany()
      backup[model.key] = records
    } catch (err: unknown) {
      console.warn(`[Backup] Skipping model "${model.key}": ${err instanceof Error ? err.message : String(err)}`)
      backup[model.key] = []
    }
  }

  return backup
}

/**
 * Generate the machine-readable JSON backup payload.
 */
export function generateJsonBackup(backup: BackupData) {
  return {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    source: 'aerojet-academy',
    tableCount: BACKUP_MODELS.length,
    recordCounts: Object.fromEntries(BACKUP_MODELS.map((m) => [m.key, backup[m.key]?.length ?? 0])),
    tables: backup,
  }
}

/**
 * Generate a human-readable HTML report of the backup data.
 * This is meant to be read by admins — shows summaries and key data, not raw JSON.
 */
export function generateReadableReport(backup: BackupData): string {
  const now = new Date()
  const totalRecords = Object.values(backup).reduce((sum, arr) => sum + arr.length, 0)

  // Helper to format a value for display
  const fmt = (val: unknown): string => {
    if (val === null || val === undefined) return '—'
    if (val instanceof Date || (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val))) {
      return new Date(val).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
    }
    if (typeof val === 'object') return JSON.stringify(val)
    return String(val)
  }

  // Build table HTML for a model's data (max 500 rows for readability)
  const buildTable = (key: string, label: string, records: unknown[]) => {
    if (!records.length) {
      return `<div class="section"><h3>${label}</h3><p class="empty">No records</p></div>`
    }

    const columns = Object.keys(records[0] as object)
    // Exclude overly long/binary columns
    const displayCols = columns.filter(
      (c) => !['password', 'html', 'body', 'content'].includes(c.toLowerCase())
    )
    const displayRows = records.slice(0, 500)

    const headerRow = displayCols.map((c) => `<th>${c}</th>`).join('')
    const dataRows = displayRows
      .map((row) => {
        const cells = displayCols.map((c) => {
          const val = fmt((row as Record<string, unknown>)[c])
          // Truncate long values
          const display = val.length > 100 ? val.substring(0, 100) + '...' : val
          return `<td>${display}</td>`
        })
        return `<tr>${cells.join('')}</tr>`
      })
      .join('')

    const truncNote =
      records.length > 500
        ? `<p class="note">Showing first 500 of ${records.length} records</p>`
        : ''

    return `
      <div class="section">
        <h3>${label} <span class="count">(${records.length})</span></h3>
        ${truncNote}
        <div class="table-wrap">
          <table><thead><tr>${headerRow}</tr></thead><tbody>${dataRows}</tbody></table>
        </div>
      </div>
    `
  }

  const sections = BACKUP_MODELS.map((m) => buildTable(m.key, m.label, backup[m.key] || [])).join(
    '\n'
  )

  const summaryRows = BACKUP_MODELS.map(
    (m) =>
      `<tr><td>${m.label}</td><td class="model-key">${m.key}</td><td class="num">${backup[m.key]?.length ?? 0}</td></tr>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Aerojet Academy - Database Backup Report</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; padding: 32px; background: #f8fafc; }
  .header { background: #002a5c; color: white; padding: 32px; border-radius: 12px; margin-bottom: 32px; }
  .header h1 { font-size: 24px; margin-bottom: 8px; }
  .header p { opacity: 0.8; font-size: 14px; }
  .meta { display: flex; gap: 32px; margin-top: 16px; font-size: 13px; }
  .meta span { background: rgba(255,255,255,0.15); padding: 4px 12px; border-radius: 6px; }
  .summary { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 32px; }
  .summary h2 { font-size: 18px; color: #002a5c; margin-bottom: 16px; }
  .summary table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .summary th { text-align: left; padding: 8px 12px; background: #f1f5f9; border: 1px solid #e2e8f0; font-weight: 600; }
  .summary td { padding: 6px 12px; border: 1px solid #e2e8f0; }
  .summary .model-key { color: #64748b; font-family: monospace; font-size: 12px; }
  .summary .num { text-align: right; font-weight: 600; }
  .section { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
  .section h3 { font-size: 16px; color: #002a5c; margin-bottom: 12px; }
  .section .count { font-weight: 400; color: #64748b; font-size: 13px; }
  .section .empty { color: #94a3b8; font-style: italic; font-size: 13px; }
  .section .note { color: #f59e0b; font-size: 12px; margin-bottom: 8px; }
  .table-wrap { overflow-x: auto; }
  .section table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .section th { text-align: left; padding: 6px 8px; background: #f1f5f9; border: 1px solid #e2e8f0; font-weight: 600; white-space: nowrap; }
  .section td { padding: 4px 8px; border: 1px solid #e2e8f0; word-break: break-all; max-width: 300px; }
  .section tr:nth-child(even) { background: #f8fafc; }
  .footer { text-align: center; color: #94a3b8; font-size: 12px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
  <div class="header">
    <h1>Aerojet Academy — Database Backup Report</h1>
    <p>Complete human-readable export of all database records</p>
    <div class="meta">
      <span>Exported: ${now.toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'medium' })}</span>
      <span>Tables: ${BACKUP_MODELS.length}</span>
      <span>Total Records: ${totalRecords.toLocaleString()}</span>
    </div>
  </div>

  <div class="summary">
    <h2>Table Summary</h2>
    <table>
      <thead><tr><th>Table</th><th>Model</th><th style="text-align:right">Records</th></tr></thead>
      <tbody>${summaryRows}</tbody>
    </table>
  </div>

  ${sections}

  <div class="footer">
    <p>Generated by Aerojet Academy Backup System</p>
    <p>This report is for administrative review. For database restoration, use the JSON backup file.</p>
  </div>
</body>
</html>`
}

/**
 * Build the email HTML body with table summary.
 */
export function buildBackupEmailHtml(backup: BackupData, filename: string) {
  const tableSummary = BACKUP_MODELS.map((m) => {
    const count = backup[m.key]?.length ?? 0
    return `<tr><td style="padding:4px 12px;border:1px solid #e2e8f0">${m.label}</td><td style="padding:4px 12px;border:1px solid #e2e8f0;text-align:right">${count}</td></tr>`
  }).join('')

  return `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#002a5c">Aerojet Academy — Database Backup</h2>
      <p>A full database backup has been exported and attached to this email.</p>
      <p><strong>Exported at:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Attachments:</strong></p>
      <ul>
        <li><strong>${filename}</strong> — Machine-readable JSON (for database restore)</li>
        <li><strong>${filename.replace('.json', '.html')}</strong> — Human-readable report (for admin review)</li>
      </ul>
      <h3 style="color:#002a5c;margin-top:24px">Table Summary</h3>
      <table style="border-collapse:collapse;font-size:13px;width:100%">
        <thead>
          <tr style="background:#f1f5f9">
            <th style="padding:6px 12px;border:1px solid #e2e8f0;text-align:left">Table</th>
            <th style="padding:6px 12px;border:1px solid #e2e8f0;text-align:right">Records</th>
          </tr>
        </thead>
        <tbody>${tableSummary}</tbody>
      </table>
      <p style="color:#64748b;font-size:12px;margin-top:24px">
        To restore this backup, import the JSON file into a PostgreSQL database using a migration script.
      </p>
    </div>
  `
}

/**
 * Send backup via email with both JSON and HTML attachments.
 */
export async function sendBackupEmail(email: string, backup: BackupData) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    throw new Error('Email service is not configured (RESEND_API_KEY missing)')
  }

  const jsonPayload = generateJsonBackup(backup)
  const jsonStr = JSON.stringify(jsonPayload, null, 2)
  const htmlReport = generateReadableReport(backup)

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const jsonFilename = `aerojet-backup-${timestamp}.json`
  const htmlFilename = `aerojet-backup-${timestamp}.html`

  const emailHtml = buildBackupEmailHtml(backup, jsonFilename)

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || EMAIL_ADDRESSES.fromNoReply,
      to: email,
      subject: `Database Backup — ${new Date().toLocaleDateString('en-GB')}`,
      html: emailHtml,
      attachments: [
        {
          filename: `${jsonFilename}.enc`,
          content: Buffer.from(await encryptBackup(jsonStr)).toString('base64'),
        },
        {
          filename: htmlFilename,
          content: Buffer.from(htmlReport).toString('base64'),
        },
      ],
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Resend API error: ${errorText}`)
  }

  return { jsonFilename, htmlFilename }
}

// ── Schedule helpers ──────────────────────────────────────────────────────

export type BackupSchedule = 'off' | 'daily' | 'weekly' | 'monthly' | 'custom'

/**
 * Check if a scheduled backup is due based on settings.
 */
export function isBackupDue(
  schedule: BackupSchedule,
  lastBackupAt: string | null,
  customDays?: number
): boolean {
  if (schedule === 'off') return false

  const now = new Date()
  if (!lastBackupAt) return true // Never backed up → due

  const last = new Date(lastBackupAt)
  const diffMs = now.getTime() - last.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  switch (schedule) {
    case 'daily':
      return diffDays >= 1
    case 'weekly':
      return diffDays >= 7
    case 'monthly':
      return diffDays >= 30
    case 'custom':
      return diffDays >= (customDays || 7)
    default:
      return false
  }
}
