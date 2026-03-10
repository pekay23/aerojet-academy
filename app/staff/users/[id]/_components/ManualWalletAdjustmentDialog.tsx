'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Wallet, Loader2, AlertCircle } from 'lucide-react'

interface ManualWalletAdjustmentDialogProps {
  userId: string
  userName: string
  currentBalance: number
  currency: string
  onSuccess?: () => void
}

export default function ManualWalletAdjustmentDialog({
  userId,
  userName,
  currentBalance,
  currency,
  onSuccess,
}: ManualWalletAdjustmentDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [action, setAction] = useState<'credit' | 'debit' | 'set_balance' | 'adjustment'>('credit')
  const [amount, setAmount] = useState<string>('')
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const numAmount = parseFloat(amount)
    if (action !== 'set_balance' && (isNaN(numAmount) || numAmount <= 0)) {
      toast.error('Please enter a valid amount')
      return
    }

    if ((action === 'debit' || action === 'adjustment') && !description) {
      toast.error('Description is required for debits and adjustments')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/staff/students/${userId}/wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          amount: action === 'set_balance' ? undefined : action === 'debit' ? numAmount : numAmount,
          targetBalance: action === 'set_balance' ? numAmount : undefined,
          description,
          reference,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update wallet')

      toast.success(data.message || 'Wallet updated successfully')
      setOpen(false)
      resetForm()
      onSuccess?.()
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setAction('credit')
    setAmount('')
    setDescription('')
    setReference('')
  }

  const isDebit = action === 'debit'
  const isSetBalance = action === 'set_balance'

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val)
        if (!val) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex h-8 items-center gap-1.5 rounded-lg border-slate-200 bg-white px-3 text-[10px] font-black tracking-widest text-[#002a5c] uppercase shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
        >
          <Wallet className="h-3.5 w-3.5" />
          Adjust Balance
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[#002a5c]" />
            Adjust Wallet: {userName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/40">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold">Current Balance</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {currency} {currentBalance.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="action"
              className="text-xs font-bold tracking-wider text-slate-400 uppercase"
            >
              Operation Type
            </Label>
            <Select value={action} onValueChange={(val: any) => setAction(val)}>
              <SelectTrigger className="w-full rounded-xl border-slate-200 bg-white focus:ring-[#002a5c] dark:border-slate-800 dark:bg-slate-950">
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">Credit (Add Funds)</SelectItem>
                <SelectItem value="debit">Debit (Deduct Funds)</SelectItem>
                <SelectItem value="set_balance">Set Balance Override</SelectItem>
                <SelectItem value="adjustment">Custom Adjustment (+/-)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="amount"
              className="text-xs font-bold tracking-wider text-slate-400 uppercase"
            >
              {isSetBalance ? 'Target Balance' : 'Amount'} ({currency})
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder={isSetBalance ? 'Enter new balance' : '0.00'}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-xl border-slate-200 focus:ring-[#002a5c] dark:border-slate-800"
              required
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-xs font-bold tracking-wider text-slate-400 uppercase"
            >
              Description / Reason{' '}
              {(isDebit || action === 'adjustment') && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id="description"
              placeholder="e.g. Cash payment received, Refund for course cancellation, Correction of previous error."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] rounded-xl border-slate-200 focus:ring-[#002a5c] dark:border-slate-800"
              required={isDebit || action === 'adjustment'}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="reference"
              className="text-xs font-bold tracking-wider text-slate-400 uppercase"
            >
              Reference ID (Optional)
            </Label>
            <Input
              id="reference"
              placeholder="e.g. Receipt #, Bank Tx ID"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="rounded-xl border-slate-200 focus:ring-[#002a5c] dark:border-slate-800"
            />
          </div>

          {isDebit && currentBalance < (parseFloat(amount) || 0) && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Warning: This will result in a negative balance.</p>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="rounded-xl"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-[#002a5c] hover:bg-[#003d85] dark:bg-blue-600 dark:hover:bg-blue-700"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply Adjustment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
