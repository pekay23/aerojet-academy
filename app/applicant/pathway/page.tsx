import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import PathwayPaymentForm from './_components/PathwayPaymentForm'
import { AlertCircle, FileText, Info } from 'lucide-react'

export const metadata: Metadata = { title: 'Complete Enrollment | Applicant Portal' }
export const dynamic = 'force-dynamic'

const PRICING: Record<string, { year1: number; total: number; name: string }> = {
  FULL_TIME_4YEAR: { year1: 8500, total: 32000, name: 'EASA Part-66 Full-Time (4 Years)' },
  FULL_TIME_2YEAR: { year1: 9500, total: 18000, name: 'EASA Part-66 Full-Time (2 Years)' },
  MILITARY_1YEAR: { year1: 6500, total: 6500, name: 'Military Certification (1 Year)' },
}

export default async function PathwayPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const userId = (session.user as any).id

  const applicant = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      registrationPaid: true,
      programmeChoice: true,
      role: true,
    },
  })

  if (!applicant) redirect('/login')

  // If already a STUDENT, they don't need this initial pathway payment page
  // (They will manage milestones in the Student Portal instead)
  if (applicant.role === 'STUDENT') {
    redirect('/student')
  }

  // If registration is not paid/approved, they shouldn't be here
  if (!applicant.registrationPaid) {
    redirect('/applicant/dashboard')
  }

  const choice = applicant.programmeChoice
  if (!choice || !PRICING[choice]) {
    // If they chose Modular or Exam Only, they should have been routed elsewhere
    return (
      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6 text-center">
        <AlertCircle className="mx-auto mb-2 h-10 w-10 text-orange-500" />
        <h2 className="text-lg font-bold text-orange-800">Invalid Pathway</h2>
        <p className="mt-2 text-sm text-orange-700">
          This page is for Full-Time and Military applicants. Please return to your dashboard.
        </p>
      </div>
    )
  }

  const pricing = PRICING[choice]
  const currencySettings = await prisma.systemSetting.findMany({
    where: { key: 'course_currency' },
  })
  const currency = currencySettings[0]?.value || 'EUR'

  // Look for any pending payment for tuition
  const pendingTuitionPayment = await prisma.payment.findFirst({
    where: {
      userId,
      referenceType: { in: ['SEAT_CONFIRMATION', 'YEAR_1_FULL', 'FULL_PROGRAMME'] },
      status: 'PENDING',
    },
  })

  // Calculate options based on rules: 40% initial seat confirmation
  const seatConfirmation = pricing.year1 * 0.4

  const paymentOptions = [
    {
      id: 'SEAT_CONFIRMATION',
      label: 'Seat Confirmation Fee (40% of Year 1)',
      amount: seatConfirmation,
      description:
        'Secures your place in the upcoming cohort. The remaining 60% of Year 1 must be paid before classes begin.',
    },
    {
      id: 'YEAR_1_FULL',
      label: 'Full First Year Tuition',
      amount: pricing.year1,
      description: 'Pay for the entire first year upfront. Best for peace of mind.',
    },
    {
      id: 'FULL_PROGRAMME',
      label: 'Complete Programme Registration',
      amount: pricing.total,
      description: 'Pay for the entire duration of the programme upfront.',
    },
  ]

  // Optional: Fetch bank details like the registration upload page
  const bankSettings = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: ['bank_name', 'bank_account_name', 'bank_account_number', 'bank_swift', 'bank_branch'],
      },
    },
  })

  const globalSettings: Record<string, string> = {}
  for (const s of bankSettings) {
    globalSettings[s.key] = s.value
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
          Complete Your Enrollment
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          You have been accepted into the <strong>{pricing.name}</strong>. Please finalize your
          enrollment by choosing a payment plan below.
        </p>
      </div>

      {pendingTuitionPayment ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center">
          <Info className="mx-auto mb-3 h-10 w-10 text-blue-500" />
          <h2 className="text-lg font-bold text-blue-900">Tuition Payment Under Review</h2>
          <p className="mt-2 flex flex-col gap-2 text-sm text-blue-800">
            <span>
              We have received your proof of payment for{' '}
              <strong>
                {currency} {pendingTuitionPayment.amount.toLocaleString()}
              </strong>
              .
            </span>
            <span>
              Our admissions team is verifying the transfer. You will be automatically promoted to a
              Student account once approved.
            </span>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            {/* Info Box */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800">
                  <FileText className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">{pricing.name}</h3>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                    Approved
                  </span>
                </div>
              </div>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex justify-between">
                  <span>Year 1 Total:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {currency} {pricing.year1.toLocaleString()}
                  </span>
                </li>
                <li className="flex justify-between border-b border-slate-50 pb-3 dark:border-slate-800">
                  <span>Programme Total:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {currency} {pricing.total.toLocaleString()}
                  </span>
                </li>
              </ul>
            </div>

            {/* Bank Details */}
            <div className="rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 font-bold text-slate-900 dark:text-slate-100">
                Bank Transfer Details
              </h2>
              <dl className="space-y-3 text-sm">
                {[
                  { label: 'Bank', value: globalSettings.bank_name },
                  { label: 'Account Name', value: globalSettings.bank_account_name },
                  { label: 'Account Number', value: globalSettings.bank_account_number },
                  { label: 'Swift / BIC', value: globalSettings.bank_swift },
                  { label: 'Branch', value: globalSettings.bank_branch },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex flex-col gap-1 border-b border-slate-50 pb-2 last:border-0"
                  >
                    <dt className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      {label}
                    </dt>
                    <dd className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {value ?? '—'}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div>
            <PathwayPaymentForm
              options={paymentOptions}
              currency={currency}
              programmeName={pricing.name}
            />
          </div>
        </div>
      )}
    </div>
  )
}
