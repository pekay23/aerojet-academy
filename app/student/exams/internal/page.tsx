import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import InternalExamDashboard from './_components/InternalExamDashboard'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'

export const metadata: Metadata = { title: 'Internal Exams | Student' }
export const dynamic = 'force-dynamic'

export default async function StudentInternalExamsPage() {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'STUDENT') return await redirectToLogin()
  if (!(await isInternalExamSystemEnabled())) redirect('/student/exams?tab=records')

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-700">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-blue-800 dark:text-white">
          Module Examinations
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          EASA Part-66 module exams. 75% pass mark required. Single attempt per module.
        </p>
      </div>
      <InternalExamDashboard />
    </div>
  )
}
