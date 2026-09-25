import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { getAuthSession } from '@/lib/auth/helpers'
import { getEasaComplianceReport } from '@/lib/compliance/reports'
import { format } from 'date-fns'
import { Metadata } from 'next'
import { Award, Download, CheckCircle2, XCircle, HelpCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import MetricCard from '@/components/shared/MetricCard'

export const metadata: Metadata = { title: 'EASA Compliance | Staff Portal' }
export const dynamic = 'force-dynamic'

const STATUS_STYLES: Record<
  'COMPLIANT' | 'NON_COMPLIANT' | 'INSUFFICIENT_DATA',
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  COMPLIANT: {
    label: 'Compliant',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    icon: CheckCircle2,
  },
  NON_COMPLIANT: {
    label: 'Non-Compliant',
    className: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    icon: XCircle,
  },
  INSUFFICIENT_DATA: {
    label: 'Insufficient Data',
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    icon: HelpCircle,
  },
}

export default async function EasaCompliancePage() {
  const session = await getAuthSession()
  if (!session) return await redirectToLogin()

  const report = await getEasaComplianceReport()

  return (
    <div className="mx-auto max-w-480 space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-aerojet-blue text-3xl font-black tracking-tight sm:text-4xl dark:text-white">
            EASA Compliance Report
          </h1>
          <p className="flex items-center gap-2 text-base font-medium text-slate-500 dark:text-slate-400">
            <Award className="text-aerojet-sky h-5 w-5" />
            Part-147/145 official EASA module exam compliance & export.
          </p>
        </div>
        <a
          href="/api/staff/reports/easa-compliance/export"
          className="bg-aerojet-blue hover:bg-aerojet-blue/90 flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </a>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Overall Pass Rate"
          value={`${report.overallPassRate}%`}
          icon={Award}
          color="bg-emerald-50 text-emerald-600"
          label={`EASA pass mark ${report.passMark}%`}
        />
        <MetricCard
          title="Total Attempts"
          value={report.totalAttempts}
          icon={CheckCircle2}
          color="bg-blue-50 text-blue-600"
          label="Across all EASA modules"
        />
        <MetricCard
          title="Passed"
          value={report.totalPassed}
          icon={CheckCircle2}
          color="bg-emerald-50 text-emerald-600"
          label="Graded passes"
        />
        <MetricCard
          title="Failed"
          value={report.totalFailed}
          icon={XCircle}
          color="bg-red-50 text-red-600"
          label="Graded failures"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-aerojet-blue text-sm font-black tracking-widest uppercase dark:text-white">
            Module Compliance Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800/20">
                <tr>
                  <th className="px-6 py-4">Module</th>
                  <th className="px-6 py-4 text-center">Attempts</th>
                  <th className="px-6 py-4 text-center">Passed</th>
                  <th className="px-6 py-4 text-center">Failed</th>
                  <th className="px-6 py-4 text-center">Pass Rate</th>
                  <th className="px-6 py-4 text-center">Avg Score</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {report.modules.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm font-medium text-slate-400 italic"
                    >
                      No EASA exam records found.
                    </td>
                  </tr>
                ) : (
                  report.modules.map((m) => {
                    const cfg = STATUS_STYLES[m.complianceStatus]
                    const StatusIcon = cfg.icon
                    return (
                      <tr
                        key={m.moduleCode}
                        className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-6 py-4">
                          <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {m.moduleCode}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">
                          {m.totalAttempts}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-emerald-600">
                          {m.passed}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-red-500">{m.failed}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-sm font-black text-slate-700 dark:text-slate-200">
                              {m.passRate}%
                            </span>
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className={`h-full ${
                                  m.complianceStatus === 'COMPLIANT'
                                    ? 'bg-emerald-500'
                                    : m.complianceStatus === 'NON_COMPLIANT'
                                      ? 'bg-red-500'
                                      : 'bg-slate-400'
                                }`}
                                style={{ width: `${Math.min(m.passRate, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-600 dark:text-slate-300">
                          {m.avgScore != null ? `${m.avgScore}%` : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black uppercase ${cfg.className}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <p className="px-6 py-3 text-xs text-slate-400">
            Generated {format(report.generatedAt, 'MMM d, yyyy HH:mm')} · Compliance threshold: pass
            rate ≥ {report.passMark}%.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
