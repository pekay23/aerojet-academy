import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import QuestionEditor from './_components/QuestionEditor'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { prismaUnfiltered } from '@/lib/prisma/client'

export const metadata: Metadata = { title: 'Manage Questions | Staff' }
export const dynamic = 'force-dynamic'

export default async function BankQuestionsPage({ params }: { params: Promise<{ bankId: string }> }) {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF', 'EXAMINER', 'INSTRUCTOR'].includes(session.user.role)) {
    redirect('/login')
  }
  if (!(await isInternalExamSystemEnabled())) {
    redirect('/staff/exams/internal')
  }

  const { bankId } = await params

  const bank = await prismaUnfiltered.internalExamBank.findUnique({
    where: { id: bankId },
    select: { id: true, name: true, course: { select: { code: true } } },
  })

  if (!bank) {
    redirect('/staff/exams/internal')
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4">
        <a
          href="/staff/exams/internal"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-aerojet-blue dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          ←
        </a>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-aerojet-blue dark:text-white sm:text-3xl">
            {bank.name}
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            {bank.course.code} • Manage questions, explanations, and bulk import
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <QuestionEditor bankId={bankId} />
      </div>
    </div>
  )
}
