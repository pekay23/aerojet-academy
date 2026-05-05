'use client'

import { useEffect, useState } from 'react'
import {
  Download,
  Mail,
  Loader2,
  AlertCircle,
  Database,
  Clock,
  FileJson,
  FileText,
  Zap,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

type Schedule = 'off' | 'daily' | 'weekly' | 'monthly' | 'custom'

const SCHEDULE_OPTIONS: { value: Schedule; label: string; description: string }[] = [
  { value: 'off', label: 'Off', description: 'No automatic backups' },
  { value: 'daily', label: 'Daily', description: 'Every day at 4:00 AM UTC' },
  { value: 'weekly', label: 'Weekly', description: 'Every 7 days' },
  { value: 'monthly', label: 'Monthly', description: 'Every 30 days' },
  { value: 'custom', label: 'Custom', description: 'Set a custom interval' },
]

export default function BackupManager({ adminEmail }: { adminEmail?: string }) {
  const [downloading, setDownloading] = useState<'json' | 'html' | null>(null)
  const [emailing, setEmailing] = useState(false)
  const [backingUpNow, setBackingUpNow] = useState(false)
  const [email, setEmail] = useState(adminEmail || '')

  // Schedule state
  const [schedule, setSchedule] = useState<Schedule>('off')
  const [scheduleEmail, setScheduleEmail] = useState(adminEmail || '')
  const [customDays, setCustomDays] = useState('7')
  const [lastRun, setLastRun] = useState<string | null>(null)
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [loadingSchedule, setLoadingSchedule] = useState(true)

  // Load current schedule
  useEffect(() => {
    fetch('/api/admin/backup/schedule')
      .then((r) => r.json())
      .then((data) => {
        setSchedule(data.schedule || 'off')
        setScheduleEmail(data.email || adminEmail || '')
        setCustomDays(data.customDays || '7')
        setLastRun(data.lastRun || null)
      })
      .catch(() => {})
      .finally(() => setLoadingSchedule(false))
  }, [adminEmail])

  const handleDownload = async (format: 'json' | 'html') => {
    setDownloading(format)
    try {
      const res = await fetch(`/api/admin/backup?format=${format}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to export backup')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download =
        res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') ||
        `aerojet-backup.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      toast.success(`${format.toUpperCase()} backup downloaded`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to download backup')
    } finally {
      setDownloading(null)
    }
  }

  const handleEmail = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address')
      return
    }

    setEmailing(true)
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send backup')

      toast.success(`Backup sent to ${email.trim()} (JSON + HTML)`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to email backup')
    } finally {
      setEmailing(false)
    }
  }

  const handleBackupNow = async () => {
    if (!scheduleEmail.trim()) {
      toast.error('Please set a backup email address first')
      return
    }

    setBackingUpNow(true)
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: scheduleEmail.trim() }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send backup')

      setLastRun(new Date().toISOString())
      toast.success('Backup completed and sent!')
    } catch (err: any) {
      toast.error(err.message || 'Backup failed')
    } finally {
      setBackingUpNow(false)
    }
  }

  const handleSaveSchedule = async () => {
    if (schedule !== 'off' && !scheduleEmail.trim()) {
      toast.error('Email address is required for scheduled backups')
      return
    }

    setSavingSchedule(true)
    try {
      const res = await fetch('/api/admin/backup/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule,
          email: scheduleEmail.trim(),
          customDays: parseInt(customDays) || 7,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save schedule')

      toast.success('Backup schedule saved')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save schedule')
    } finally {
      setSavingSchedule(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/30">
            <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Database Backup
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Export all data from the database. Backups are available in two formats:
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-700/50">
                <FileJson className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    JSON (Machine-Readable)
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    For database restoration. Import directly into PostgreSQL or any compatible
                    database.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-700/50">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    HTML (Human-Readable)
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Formatted report with all tables and records. Open in any browser for review.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Automatic Backup Schedule */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Automatic Backup Schedule
          </h4>
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Schedule automatic backups. Both JSON and HTML formats are sent to the specified email.
        </p>

        {loadingSchedule ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading schedule...
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Schedule Options */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {SCHEDULE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSchedule(opt.value)}
                  className={`rounded-lg border-2 px-3 py-2 text-left transition-all ${
                    schedule === opt.value
                      ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:hover:border-slate-500'
                  }`}
                >
                  <p
                    className={`text-xs font-bold ${schedule === opt.value ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-white'}`}
                  >
                    {opt.label}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>

            {/* Custom Days Input */}
            {schedule === 'custom' && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Every
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="w-20 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">days</span>
              </div>
            )}

            {/* Schedule Email */}
            {schedule !== 'off' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Send backups to
                </label>
                <input
                  type="email"
                  value={scheduleEmail}
                  onChange={(e) => setScheduleEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
            )}

            {/* Last Run */}
            {lastRun && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Last backup:{' '}
                {new Date(lastRun).toLocaleString('en-GB', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </div>
            )}

            {/* Save + Backup Now */}
            <div className="flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-700">
              <button
                onClick={handleSaveSchedule}
                disabled={savingSchedule}
                className="inline-flex items-center gap-2 rounded-lg bg-aerojet-blue px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#003d82] disabled:opacity-50"
              >
                {savingSchedule && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Schedule
              </button>
              <button
                onClick={handleBackupNow}
                disabled={backingUpNow || !scheduleEmail.trim()}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"
              >
                {backingUpNow ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
                {backingUpNow ? 'Backing up...' : 'Backup Now'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Download Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Download Backup</h4>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Download a complete backup file directly to your device.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => handleDownload('json')}
            disabled={downloading !== null}
            className="inline-flex items-center gap-2 rounded-lg bg-aerojet-blue px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#003d82] disabled:opacity-50"
          >
            {downloading === 'json' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileJson className="h-4 w-4" />
            )}
            {downloading === 'json' ? 'Exporting...' : 'Download JSON'}
          </button>
          <button
            onClick={() => handleDownload('html')}
            disabled={downloading !== null}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all duration-150 ease-out hover:border-slate-400 hover:shadow-sm disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:hover:border-slate-500"
          >
            {downloading === 'html' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {downloading === 'html' ? 'Exporting...' : 'Download HTML Report'}
          </button>
        </div>
      </div>

      {/* Email Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Email Backup</h4>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Send both backup formats (JSON + HTML report) as email attachments.
        </p>
        <div className="mt-4 flex items-end gap-3">
          <div className="flex-1">
            <label
              htmlFor="backup-email"
              className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              Recipient email
            </label>
            <input
              id="backup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <button
            onClick={handleEmail}
            disabled={emailing || !email.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {emailing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            {emailing ? 'Sending...' : 'Send Backup'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
        <div className="flex gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <p className="font-medium">Important notes</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs">
              <li>
                <strong>JSON backup</strong> contains all raw data and can be imported into any
                PostgreSQL database
              </li>
              <li>
                <strong>HTML report</strong> is a formatted, readable view of all records for admin
                review
              </li>
              <li>Passwords are exported as bcrypt hashes (secure, not reversible)</li>
              <li>Email attachments are limited to ~25MB — for very large databases, use download</li>
              <li>Store backups securely — they contain sensitive user data</li>
              <li>Automatic backups run daily at 4:00 AM UTC via Vercel Cron</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
