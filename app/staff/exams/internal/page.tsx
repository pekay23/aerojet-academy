import { Metadata } from 'next'
import { requireStaff } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import ExamBankManager from './_components/ExamBankManager'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'

export const metadata: Metadata = { title: 'Internal Exams | Staff' }
export const dynamic = 'force-dynamic'

export default async function InternalExamsPage() {
  await requireStaff()
  if (!(await isInternalExamSystemEnabled())) redirect('/staff/exams')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
          Internal Exam System
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Manage EASA-compliant question banks, monitor pool health, and review student sessions.
        </p>
      </div>

      <ExamBankManager />
    </div>
  )
}
