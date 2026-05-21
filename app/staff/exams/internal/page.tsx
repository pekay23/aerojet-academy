import { Metadata } from 'next'
import { Eye } from 'lucide-react'
import Link from 'next/link'
import { requireStaff } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import ExamBankManager from './_components/ExamBankManager'
import ExamOperations from './_components/ExamOperations'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import InternalExamPageTabs from './_components/InternalExamPageTabs'

export const metadata: Metadata = { title: 'Internal Exams | Staff' }
export const dynamic = 'force-dynamic'

export default async function InternalExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  await requireStaff()
  if (!(await isInternalExamSystemEnabled())) redirect('/staff/exams')

  const params = await searchParams
  const tab = params.tab || 'banks'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
            Internal Exam System
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Manage EASA-compliant question banks, monitor pool health, and review student sessions.
          </p>
        </div>
        <Link
          href="/staff/exams/internal/preview"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-aerojet-blue/50 hover:text-aerojet-blue dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <Eye className="h-4 w-4" />
          Preview as Student
        </Link>
      </div>

      <InternalExamPageTabs activeTab={tab} />

      {tab === 'banks' && <ExamBankManager />}
      {tab === 'operations' && <ExamOperations />}
    </div>
  )
}
