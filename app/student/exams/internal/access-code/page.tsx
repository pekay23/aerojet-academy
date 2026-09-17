import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireStudent } from '@/lib/auth/helpers'
import AccessCodeEntry from './_components/AccessCodeEntry'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'

export const metadata: Metadata = { title: 'Exam Access Code | Student' }
export const dynamic = 'force-dynamic'

export default async function AccessCodePage() {
  await requireStudent()
  if (!(await isInternalExamSystemEnabled())) redirect('/student/exams?tab=records')

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-blue-800 dark:text-white">
          Exam Access Code
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          Enter the access code provided by your instructor to begin your exam.
        </p>
      </div>
      <AccessCodeEntry />
    </div>
  )
}
