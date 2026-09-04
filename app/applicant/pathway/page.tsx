import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered, prisma } from '@/lib/prisma/client'
import PathwayPaymentForm from './_components/PathwayPaymentForm'
import MilestoneTracker from './_components/MilestoneTracker'
import { AlertCircle, FileText, Info, CheckCircle2, Wallet, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Complete Enrollment | Applicant Portal' }
export const dynamic = 'force-dynamic'

const PATHWAY_PRICING: Record<
  string,
  { year1: number; total: number; name: string; years: number }
> = {
  FULL_TIME_4YEAR: {
    year1: 8500,
    total: 32000,
    name: 'EASA Part-66 Full-Time (4 Years)',
    years: 4,
  },
  FULL_TIME_2YEAR: {
    year1: 9500,
    total: 18000,
    name: 'EASA Part-66 Full-Time (2 Years)',
    years: 2,
  },
  MILITARY_1YEAR: { year1: 6500, total: 6500, name: 'Military Certification (1 Year)', years: 1 },
}

export default async function PathwayPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const userId = session.user.id

  const [applicant, enrollment, currencySettings, wallet, pendingTuitionPayment, bankSettings] =
    await Promise.all([
      prismaUnfiltered.user.findUnique({
        where: { id: userId },
        select: { registrationPaid: true, programmeChoice: true, role: true },
      }),
      prismaUnfiltered.fullTimeEnrollment.findFirst({
        where: { studentId: userId },
        include: { programme: true, academicYear: true, milestones: { orderBy: { yearNumber: 'asc' } } },
      }),
      prisma.systemSetting.findMany({ where: { key: 'course_currency' } }),
      prisma.wallet.findUnique({ where: { userId } }),
      prisma.payment.findFirst({
        where: {
          userId,
          referenceType: {
            in: ['SEAT_CONFIRMATION', 'YEAR_1_FULL', 'FULL_PROGRAMME', 'CUSTOM_PART_PAYMENT'],
          },
          status: 'PENDING',
        },
      }),
      prisma.systemSetting.findMany({
        where: {
          key: {
            in: [
              'bank_name',
              'bank_account_name',
              'bank_account_number',
              'bank_swift',
              'bank_branch',
            ],
          },
        },
      }),
    ])

  if (!applicant) redirect('/login')

  // If already a STUDENT and has enrollment, redirect to student portal
  if (applicant.role === 'STUDENT' && enrollment) {
    redirect('/student')
  }

  // If registration is not paid/approved, they shouldn't be here
  if (!applicant.registrationPaid) {
    redirect('/applicant/dashboard')
  }

  const choice = applicant.programmeChoice
  if (!choice || !PATHWAY_PRICING[choice as keyof typeof PATHWAY_PRICING]) {
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

  const pricing = PATHWAY_PRICING[choice as keyof typeof PATHWAY_PRICING]
  const currency = currencySettings[0]?.value || 'EUR'

  // If enrollment exists and seat is confirmed, show milestone tracker
  if (enrollment) {
    const seatMilestone = enrollment.milestones.find(
      (m: (typeof enrollment.milestones)[number]) => m.milestoneType === 'SEAT_CONFIRMATION'
    )
    const seatPaid = seatMilestone?.status === 'PAID'

    if (seatPaid) {
      return (
        <div className="max-w-7xl space-y-6">
          <div>
            <h1 className="text-aerojet-blue text-2xl font-black tracking-tight sm:text-3xl dark:text-white">
              Enrollment Progress
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Your seat in the <strong>{pricing.name}</strong> has been confirmed. Complete the
              remaining payment milestones to begin your studies.
            </p>
          </div>

          {/* Enrollment Confirmed Card */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900/30 dark:bg-emerald-900/10">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="mt-0.5 h-8 w-8 shrink-0 text-emerald-500" />
              <div>
                <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                  Seat Confirmed
                </h2>
                <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
                   Your place in <strong>{enrollment.programme.name}</strong> is secured. Year{' '}
                   {enrollment.currentYearNumber} — {enrollment.academicYear?.name || '2026/2027'}
                </p>
              </div>
            </div>
          </div>

          {/* Next Step Alert */}
          {enrollment.milestones.some(
            (m: (typeof enrollment.milestones)[number]) =>
              m.milestoneType === 'SEM1_DUE' && m.status === 'DUE'
          ) && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/30 dark:bg-amber-900/10">
              <div className="flex items-start gap-4">
                <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-amber-500" />
                <div>
                  <h3 className="font-bold text-amber-900 dark:text-amber-200">
                    Next Step: Pay 30% Before Classes Begin
                  </h3>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                    You must pay the Semester 1 fee (30% of Year 1) before classes start. You can
                    top up your wallet and pay from there, or upload a direct bank transfer proof.
                  </p>
                  <p className="mt-2 text-sm font-bold text-amber-800 dark:text-amber-300">
                    Amount due: {currency}{' '}
                    {Number(
                      enrollment.milestones.find(
                        (m: (typeof enrollment.milestones)[number]) =>
                          m.milestoneType === 'SEM1_DUE'
                      )?.amountDue ?? 0
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Wallet Balance + Top-up Link */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <Wallet className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                    Wallet Balance
                  </p>
                  <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {currency} {Number(wallet?.availableBalance ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <Link
                href="/applicant/wallet-top-up"
                className="bg-aerojet-blue flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#003875]"
              >
                Top Up Wallet
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Milestone Tracker */}
          <MilestoneTracker
            milestones={enrollment.milestones.map((m: (typeof enrollment.milestones)[number]) => ({
              id: m.id,
              milestoneType: m.milestoneType,
              yearNumber: m.yearNumber,
              percentOfYearFee: Number(m.percentOfYearFee),
              amountDue: Number(m.amountDue),
              status: m.status,
              dueDate: m.dueDate.toISOString(),
              paidAt: m.paidAt?.toISOString() ?? null,
            }))}
            walletBalance={Number(wallet?.availableBalance ?? 0)}
            currency={currency}
          />
        </div>
      )
    }
  }

  // Calculate options based on programme type
  const seatConfirmation = pricing.year1 * 0.4
  const sem1Due = pricing.year1 * 0.3
  const sem2Due = pricing.year1 * 0.3

  const isMilitary = choice === 'MILITARY_1YEAR'

  const paymentOptions = isMilitary
    ? [
        {
          id: 'SEAT_CONFIRMATION',
          label: 'Part Payment Plan',
          amount: seatConfirmation,
          description:
            'Pay 40% to secure your seat. Remaining fees are due in two installments before each semester begins.',
          recommended: true,
          milestones: [
            { label: 'Seat Confirmation (40%)', amount: seatConfirmation, due: 'Due now' },
            { label: 'Before Classes Begin (30%)', amount: sem1Due, due: 'Before Sem 1' },
            { label: 'Before Semester 2 (30%)', amount: sem2Due, due: 'Before Sem 2' },
          ],
        },
        {
          id: 'CUSTOM_PART_PAYMENT',
          label: 'Custom Part Payment',
          amount: pricing.total,
          description: `Pay a custom amount (minimum ${currency} ${seatConfirmation.toLocaleString()} to secure your seat). Any amount above the seat fee reduces your remaining balance.`,
          customMin: seatConfirmation,
        },
        {
          id: 'FULL_PROGRAMME',
          label: 'Full Programme Payment',
          amount: pricing.total,
          description: 'Pay the entire programme fee upfront. No further payments needed.',
        },
      ]
    : [
        {
          id: 'SEAT_CONFIRMATION',
          label: 'Part Payment Plan',
          amount: seatConfirmation,
          description:
            'Pay 40% to secure your seat. Remaining fees are due in two installments before each semester begins.',
          recommended: true,
          milestones: [
            { label: 'Seat Confirmation (40%)', amount: seatConfirmation, due: 'Due now' },
            { label: 'Before Classes Begin (30%)', amount: sem1Due, due: 'Before Sem 1' },
            { label: 'Before Semester 2 (30%)', amount: sem2Due, due: 'Before Sem 2' },
          ],
        },
        {
          id: 'YEAR_1_FULL',
          label: 'Full First Year Payment',
          amount: pricing.year1,
          description: 'Pay for the entire first year upfront. No further Year 1 payments needed.',
        },
        {
          id: 'FULL_PROGRAMME',
          label: 'Complete Programme Payment',
          amount: pricing.total,
          description: `Pay for the full ${pricing.years}-year programme upfront. No further payments needed.`,
        },
      ]

  const globalSettings: Record<string, string> = {}
  for (const s of bankSettings) {
    globalSettings[s.key] = s.value
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 max-w-7xl space-y-6 duration-700">
      <div>
        <h1 className="text-aerojet-blue text-3xl font-black tracking-tight dark:text-white">
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
                {currency} {Number(pendingTuitionPayment.amount).toLocaleString()}
              </strong>
              .
            </span>
            <span>
              Our admissions team is verifying the transfer. You will be notified once approved.
            </span>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            {/* Programme Info */}
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
                {pricing.years > 1 && (
                  <li className="flex justify-between">
                    <span>Programme Total ({pricing.years} years):</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {currency} {pricing.total.toLocaleString()}
                    </span>
                  </li>
                )}
              </ul>

              {/* Payment Schedule Info */}
              <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                <h4 className="mb-3 text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Year 1 Payment Schedule
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 text-xs dark:bg-slate-800">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                      40% — Seat Confirmation
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {currency} {seatConfirmation.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 text-xs dark:bg-slate-800">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                      30% — Before Semester 1 starts
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {currency} {sem1Due.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 text-xs dark:bg-slate-800">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                      30% — Before Semester 2 starts
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {currency} {sem2Due.toLocaleString()}
                    </span>
                  </div>
                </div>
                {pricing.years > 1 && (
                  <p className="mt-3 text-xs text-slate-400">
                    Years 2+: 50% before Semester 1 / 50% before Semester 2
                  </p>
                )}
                <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                  Remaining payments can be made via your Wallet once your seat is confirmed.
                </p>
              </div>
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
              bankDetails={{
                bankName: globalSettings.bank_name,
                accountName: globalSettings.bank_account_name,
                accountNumber: globalSettings.bank_account_number,
                swift: globalSettings.bank_swift,
                branch: globalSettings.bank_branch,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
