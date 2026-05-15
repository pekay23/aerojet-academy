import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import InternalExamDashboard from './_components/InternalExamDashboard'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'

export const metadata: Metadata = { title: 'Internal Exams | Student' }
export const dynamic = 'force-dynamic'

export default async function StudentInternalExamsPage() {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'STUDENT') redirect('/login')
  if (!(await isInternalExamSystemEnabled())) redirect('/student/exams?tab=records')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
          Module Examinations
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          EASA Part-66 module exams. 75% pass mark required. 3 attempts allowed per module.
        </p>
      </div>
      <InternalExamDashboard />
    </div>
  )
}
