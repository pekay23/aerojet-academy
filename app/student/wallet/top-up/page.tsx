import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Building2, Copy, Smartphone, Info, CheckCircle2 } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { UploadProofForm } from './_components/UploadProofForm'

export const metadata: Metadata = { title: 'Top Up | Student Portal' }

export default async function TopUpPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const [bankSettings, studentProfile] = await Promise.all([
    prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            'bank_name',
            'bank_account_name',
            'bank_account_number',
            'bank_swift',
            'bank_branch',
            'bank_currency',
          ],
        },
      },
    }),
    prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
    }),
  ])

  const bankDetails: Record<string, string> = {}
  for (const s of bankSettings || []) {
    bankDetails[s.key] = s.value
  }

  const studentId = studentProfile?.studentId || 'N/A'

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          href="/student/wallet"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Wallet
        </Link>
        <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Top Up Wallet
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Add funds to your training account using our available payment methods.
        </p>
      </div>

      <div className="space-y-6 pb-20">
        {/* Step 1: Transfer Funds */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#002a5c] text-white">
              <span className="font-bold">1</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Transfer Funds</h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-blue-50 bg-blue-50/30 p-6">
              <div className="flex gap-4">
                <Building2 className="h-6 w-6 text-blue-600" />
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                    Bank Transfer Details
                  </p>
                  <div className="mt-4 grid gap-y-3">
                    <div className="flex justify-between border-b border-blue-100 pb-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Bank Name</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {bankDetails.bank_name || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-blue-100 pb-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Account Name</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {bankDetails.bank_account_name || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-blue-100 pb-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Account Number</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {bankDetails.bank_account_number || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-blue-100 pb-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Branch / Code</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {bankDetails.bank_branch || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-blue-100 pb-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">SWIFT Code</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {bankDetails.bank_swift || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-blue-100 pb-2">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Currency</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {bankDetails.bank_currency || 'GHS'}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                        Reference (Student ID)
                      </span>
                      <span className="text-sm font-black text-[#002a5c]">{studentId}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4 transition-colors hover:border-slate-200">
              <div className="flex gap-3 text-slate-500 dark:text-slate-400">
                <Info className="h-5 w-5 shrink-0" />
                <p className="text-xs font-medium leading-relaxed">
                  Please use your <strong>Student ID</strong> as the payment reference to ensure
                  your funds are credited correctly and quickly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Upload Proof */}
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4c9ded] text-white">
              <span className="font-bold">2</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Upload Receipt</h2>
          </div>

          <UploadProofForm studentId={studentId} />
        </div>
      </div>
    </div>
  )
}
