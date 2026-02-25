import { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, CreditCard, Landmark, Info } from 'lucide-react'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { getFinanceConfig } from '@/lib/settings'
import CoursePaymentUploadForm from '../../_components/CoursePaymentUploadForm'

export const metadata: Metadata = { title: 'Purchase Course | Applicant Portal' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function PurchasePage({ params }: Props) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { id } = await params
  const userId = (session.user as any).id

  const [course, enrollment, finance] = await Promise.all([
    prisma.course.findUnique({ where: { id } }),
    prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: id } },
    }),
    getFinanceConfig(),
  ])

  if (!course) notFound()

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          href={`/applicant/courses/${id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Course Details
        </Link>
        <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
          Purchase Course
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Complete enrollment for{' '}
          <span className="font-bold text-slate-700 dark:text-slate-200">{course.name}</span>
        </p>
      </div>

      {enrollment?.status === 'ENROLLED' || enrollment?.status === 'APPROVED' ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
          <p className="font-bold text-green-700">✅ You are already enrolled in this course.</p>
          <Link
            href="/student"
            className="mt-4 inline-block text-sm font-bold text-green-800 underline"
          >
            Go to Student Portal
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Bank Details Card */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#002a5c]">
                <Landmark className="h-5 w-5" />
              </div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100">
                Bank Transfer Details
              </h2>
            </div>

            <dl className="space-y-4 text-sm">
              {[
                { label: 'Bank Name', value: finance.bankName },
                { label: 'Account Name', value: finance.bankAccountName },
                { label: 'Account Number', value: finance.bankAccountNumber },
                { label: 'Swift / BIC', value: finance.bankSwift },
                {
                  label: 'Total Amount',
                  value: `${course.currency} ${Number(course.price).toLocaleString()}`,
                  highlight: true,
                },
              ].map(({ label, value, highlight }) => (
                <div
                  key={label}
                  className="flex flex-col gap-1 border-b border-slate-50 pb-3 last:border-0 last:pb-0"
                >
                  <dt className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    {label}
                  </dt>
                  <dd
                    className={`font-mono text-sm font-bold ${highlight ? 'text-lg text-[#002a5c] dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}
                  >
                    {value || '—'}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <p>
                Please use your <strong>Applicant ID</strong> or <strong>Name</strong> as the
                transfer reference to speed up verification.
              </p>
            </div>
          </div>

          {/* Upload Card */}
          <CoursePaymentUploadForm courseId={id} courseName={course.name} />
        </div>
      )}
    </div>
  )
}
