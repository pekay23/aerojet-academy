'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Wallet, ShieldAlert } from 'lucide-react'

interface WalletConfirmModalProps {
  children: React.ReactNode
  title?: string
  description?: string
  amount: number
  currency?: string
  onConfirm: () => void
  onCancel?: () => void
  isDestructive?: boolean
  processing?: boolean
}

export function WalletConfirmModal({
  children,
  title = 'Confirm Payment',
  description = 'Are you sure you want to proceed with this payment? This action will immediately deduct funds from your wallet and cannot be undone.',
  amount,
  currency = 'EUR',
  onConfirm,
  onCancel,
  isDestructive = false,
  processing = false,
}: WalletConfirmModalProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center rounded-xl p-2 ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}
            >
              {isDestructive ? <ShieldAlert className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
            </div>
            <AlertDialogTitle className="text-xl font-bold">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="mt-4 text-slate-600 dark:text-slate-400">
            {description}

            <div className="mt-6 mb-2 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold tracking-widest text-slate-500 uppercase">
                  Amount to Deduct
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {currency} {amount.toFixed(2)}
                </span>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel
            onClick={onCancel}
            disabled={processing}
            className="rounded-xl font-bold"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={processing}
            className={`rounded-xl px-6 py-2 font-bold text-white transition-all active:scale-95 ${
              isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {processing ? 'Processing...' : 'Confirm Payment'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
