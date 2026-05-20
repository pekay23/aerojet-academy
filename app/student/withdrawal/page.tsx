import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import WithdrawalForm from './WithdrawalForm'

export const metadata: Metadata = { title: 'Request Withdrawal | Student Portal' }

const STATUS_LABEL: Record<string, string> = {
  REQUESTED: 'Submitted — awaiting staff confirmation',
  STAFF_CONFIRMED: 'Confirmed by staff — awaiting admin approval',
  ADMIN_APPROVED: 'Approved by admin — processing',
  COMPLETED: 'Withdrawal completed',
  REJECTED: 'Request rejected',
  CANCELLED: 'Request cancelled',
}

export default async function StudentWithdrawalPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const existing = await prisma.withdrawalRequest.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  const isOpen =
    existing && ['REQUESTED', 'STAFF_CONFIRMED', 'ADMIN_APPROVED'].includes(existing.status)

  return (
    <div className="mx-auto max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
          Request Withdrawal
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Submitting a withdrawal request begins a formal process. It is only final after staff
          confirmation and final approval from an administrator.
        </p>
      </div>

      {existing && (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            existing.status === 'REJECTED'
              ? 'border-red-100 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200'
              : existing.status === 'COMPLETED'
                ? 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200'
                : 'border-amber-100 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200'
          }`}
        >
          <p className="font-bold">{STATUS_LABEL[existing.status] ?? existing.status}</p>
          <p className="mt-1 opacity-80">Reason: {existing.reason}</p>
          {existing.rejectedReason && (
            <p className="mt-1 opacity-80">Staff note: {existing.rejectedReason}</p>
          )}
          <p className="mt-1 text-xs opacity-60">
            Submitted {existing.createdAt.toLocaleDateString('en-GB')}
          </p>
        </div>
      )}

      {!isOpen && (
        <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
            <p>
              Please describe your reason for withdrawing. Staff may contact you before the request
              is finalised.
            </p>
          </div>
          <WithdrawalForm />
        </div>
      )}
    </div>
  )
}
