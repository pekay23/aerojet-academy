import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import PathwayPaymentForm from '../pathway/_components/PathwayPaymentForm'
import { Info, Wallet } from 'lucide-react'
import { getActivePaymentMethods } from '@/lib/payment-methods'
import PaymentMethodsDisplay from '@/components/shared/PaymentMethodsDisplay'

export const metadata: Metadata = { title: 'Exam Wallet Top-Up | Applicant Portal' }
export const dynamic = 'force-dynamic'

export default async function ApplicantWalletTopUpPage() {
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

  if (applicant.role === 'STUDENT') {
    redirect('/student/wallet')
  }

  const pendingPayment = await prisma.payment.findFirst({
    where: {
      userId,
      referenceType: 'WALLET_TOPUP',
      status: 'PENDING',
    },
  })

  const settings = await prisma.systemSetting.findMany({
    where: { key: 'course_currency' },
  })
  const currency = settings[0]?.value || 'EUR'

  const { getCurrencySymbol } = await import('@/lib/currency')
  const symbol = getCurrencySymbol(currency)

  const paymentOptions = [
    {
      id: 'WALLET_TOPUP',
      label: `Single Exam Pool — ${symbol}300`,
      amount: 300,
      description: 'Sufficient funds to reserve a seat in one examination pool.',
    },
    {
      id: 'WALLET_TOPUP',
      label: `Two Exam Pools — ${symbol}600`,
      amount: 600,
      description: 'Funds for reserving seats in two examination pools.',
    },
    {
      id: 'WALLET_TOPUP',
      label: `Five Exam Pools — ${symbol}1,500`,
      amount: 1500,
      description: 'Best for candidates planning multiple immediate assessments.',
    },
  ]

  const activePaymentMethods = await getActivePaymentMethods()

  // Bank details
  const bankSettings = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: ['bank_name', 'bank_account_name', 'bank_account_number', 'bank_swift', 'bank_branch'],
      },
    },
  })
  const bankDetails: Record<string, string> = {}
  for (const s of bankSettings) {
    bankDetails[s.key] = s.value
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
          Top-Up Your Exam Wallet
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          To join an exam pool, you must first credit your Aerojet Wallet. Uploading a valid top-up
          receipt will automatically verify your student status.
        </p>
      </div>

      {pendingPayment ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center">
          <Info className="mx-auto mb-3 h-10 w-10 text-blue-500" />
          <h2 className="text-lg font-bold text-blue-900">Top-Up Under Review</h2>
          <p className="mt-2 flex flex-col gap-2 text-sm text-blue-800">
            <span>
              We have received your proof of payment for{' '}
              <strong>
                {currency} {pendingPayment.amount.toLocaleString()}
              </strong>
              .
            </span>
            <span>
              Our admissions team is verifying the transfer. You will be automatically promoted to
              an active Student account once approved, at which point you can join Exam Pools.
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
                  <Wallet className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">
                    Exam Wallet Top-Up
                  </h3>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                    Required
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Aerojet Academy operates a wallet system for modular exams. You can top up your
                wallet via the payment methods below. Any unused funds remain secure in your wallet
                for future pools.
              </p>
            </div>

            {/* Payment Methods */}
            <PaymentMethodsDisplay methods={activePaymentMethods} />
          </div>

          <div>
            <PathwayPaymentForm
              options={paymentOptions}
              currency={currency}
              programmeName="Wallet Top-Up"
              bankDetails={bankDetails}
            />
          </div>
        </div>
      )}
    </div>
  )
}
