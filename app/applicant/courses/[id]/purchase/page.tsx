import { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, Info } from 'lucide-react'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { getActivePaymentMethods } from '@/lib/payment-methods'
import PaymentMethodsDisplay from '@/components/shared/PaymentMethodsDisplay'
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

  const [course, enrollment, paymentMethods] = await Promise.all([
    prisma.course.findUnique({
      where: { id },
      include: { category: true },
    }),
    prisma.enrollment.findFirst({
      where: { userId, courseId: id },
    }),
    getActivePaymentMethods(),
  ])

  if (!course) notFound()

  // Fetch user's profile and license targets to show their "entered" category
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      licenseTargets: {
        include: { licenseCategory: true },
      },
    },
  })

  const targetLicenseCodes = studentProfile?.licenseTargets
    .map((lt) => lt.licenseCategory.code)
    .join(', ')

  // Check if this course is specifically required for their license
  const isRequiredForTarget = await prisma.licenseModuleRequirement.findFirst({
    where: {
      courseId: id,
      licenseCategory: {
        code: { in: studentProfile?.licenseTargets.map((lt) => lt.licenseCategory.code) || [] },
      },
    },
  })

  const isExamOnly = studentProfile?.enrollmentType === 'EXAM_ONLY'
  const examPrice = 300

  // Fetch wallet balance if exam only
  let balance = 0
  if (isExamOnly) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: { balance: true },
    })
    balance = Number(wallet?.balance || 0)

    // If they landed here without enough money, send them back to top up
    if (balance < examPrice) {
      redirect('/applicant/wallet-top-up')
    }
  }

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
        <h1 className="mt-4 text-2xl font-black tracking-tight text-aerojet-blue sm:text-3xl dark:text-white">
          {isExamOnly ? 'Book Exam' : 'Purchase Course'}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isExamOnly ? 'Complete exam booking for' : 'Complete enrollment for'}{' '}
            <span className="font-bold text-slate-700 dark:text-slate-200">{course.name}</span>
          </p>
          <div className="flex gap-2">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {course.category?.name || course.categoryId || 'CORE'}
            </span>
            {isRequiredForTarget && (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                Target: {targetLicenseCodes}
              </span>
            )}
          </div>
        </div>
      </div>

      {enrollment?.status === 'ENROLLED' || enrollment?.status === 'APPROVED' ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
          <p className="font-bold text-green-700">You are already enrolled in this course.</p>
          <Link
            href="/student"
            className="mt-4 inline-block text-sm font-bold text-green-800 underline"
          >
            Go to Student Portal
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Total Amount */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                {isExamOnly ? 'Exam Fee (Pool)' : 'Total Amount'}
              </span>
              <span className="font-mono text-lg font-black text-aerojet-blue dark:text-blue-400">
                {course.currency}{' '}
                {isExamOnly ? examPrice.toLocaleString() : Number(course.price).toLocaleString()}
              </span>
            </div>

            <PaymentMethodsDisplay methods={paymentMethods} />

            <div className="mt-4 flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
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
