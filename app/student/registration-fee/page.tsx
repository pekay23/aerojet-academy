import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Wallet, AlertTriangle, Info } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { getCurrencySymbol } from '@/lib/currency'
import { convertCurrency } from '@/lib/currency-api'
import PayRegistrationFeeButton from './_components/PayRegistrationFeeButton'

export const metadata: Metadata = {
  title: 'Registration Fee | Student Portal',
  description: 'Pay your registration fee to enroll in courses.',
}

export default async function RegistrationFeePage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const userId = session.user.id

  const [user, wallet] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        registrationFee: true,
        registrationCurrency: true,
        registrationPaid: true,
        paymentApprovedAt: true,
      },
    }),
    prisma.wallet.findUnique({
      where: { userId },
      select: { availableBalance: true, currency: true },
    }),
  ])

  if (!user) redirect('/login')

  const fee = Number(user.registrationFee)
  const feeCurrency = 'GHS'
  const symbol = 'GH₵'
  
  const walletBalance = wallet ? Number(wallet.availableBalance) : 0
  const walletCurrency = wallet?.currency || 'EUR'
  const walletSymbol = getCurrencySymbol(walletCurrency)

  // Determine if student has enough funds, considering currency conversion
  let availableInFeeCurrency = walletBalance

  if (wallet && walletCurrency !== feeCurrency) {
    const conversion = await convertCurrency(walletBalance, walletCurrency, feeCurrency)
    availableInFeeCurrency = conversion.convertedAmount
  }

  const canPay = availableInFeeCurrency >= fee

  // Already paid — success state
  if (user.registrationPaid) {
    return (
      <div className="mx-auto max-w-lg space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-3xl font-black tracking-tight text-blue-800 dark:text-white">Registration Fee</h1>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-800/50 dark:bg-emerald-900/10">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
          <h2 className="mb-2 text-lg font-black text-emerald-800 dark:text-emerald-200">
            Registration Fee Paid
          </h2>
          <p className="mb-1 text-sm text-emerald-700 dark:text-emerald-300">
            Amount: {symbol}{fee.toFixed(2)} {feeCurrency}
          </p>
          {user.paymentApprovedAt && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              Paid on{' '}
              {new Date(user.paymentApprovedAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
        <div className="text-center">
          <Link
            href="/student"
            className="text-sm font-medium text-blue-800 underline hover:no-underline dark:text-blue-400"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Not paid — payment form
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-black text-blue-800 dark:text-white">Registration Fee</h1>

      {/* Fee amount card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-800/10 dark:bg-blue-500/10">
            <Info className="h-5 w-5 text-blue-800 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Amount Due</p>
            <p className="text-2xl font-black text-blue-800 dark:text-white">
              {symbol}{fee.toFixed(2)} <span className="text-sm font-medium text-slate-400">{feeCurrency}</span>
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Registration fee is required before you can enroll in courses. This is a one-time payment.
        </p>
      </div>

      {/* Wallet balance card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/10">
            <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Wallet Balance (Available)
            </p>
            <p className="text-xl font-black text-slate-800 dark:text-white">
              {walletSymbol}{walletBalance.toFixed(2)}{' '}
              <span className="text-sm font-medium text-slate-400">
                {walletCurrency}
              </span>
            </p>
            {walletCurrency !== feeCurrency && (
              <p className="mt-1 text-xs font-medium text-slate-500">
                ≈ {symbol}{availableInFeeCurrency.toFixed(2)} {feeCurrency}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action area */}
      {canPay ? (
        <PayRegistrationFeeButton fee={fee} symbol={symbol} currency={feeCurrency} />
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800/50 dark:bg-amber-900/10">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-500" />
            <h3 className="mb-2 text-sm font-black text-amber-800 dark:text-amber-200">
              Insufficient Funds
            </h3>
            <p className="mb-4 text-sm text-amber-700 dark:text-amber-300">
              You need {symbol}{(fee - availableInFeeCurrency).toFixed(2)} more to pay the registration fee.
            </p>
            <Link
              href="/student/wallet?action=topup"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-800 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#001d42]"
            >
              <Wallet className="h-4 w-4" />
              Top Up Wallet
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
