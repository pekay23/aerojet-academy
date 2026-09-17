'use client'

import { useState } from 'react'
import { Calendar, Users, CheckCircle2, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { bookRevisionRun } from '../actions'
import { useRouter } from 'next/navigation'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

interface RevisionRunCardProps {
  run: {
    id: string
    moduleTag: string | null
    price: number
    title: string
    description: string | null
    startDatetime: Date
    currentEnrollments: number
    capacity: number
  }
  isBooked: boolean
  walletBalance: number
}

export default function RevisionRunCard({
  run,
  isBooked,
  walletBalance
}: RevisionRunCardProps) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleBookClick = () => {
    if (walletBalance < Number(run.price)) {
      toast.error('Insufficient funds in your wallet')
      return
    }
    setShowConfirm(true)
  }

  const executeBook = async () => {
    setShowConfirm(false)
    setLoading(true)
    try {
      const res = await bookRevisionRun(run.id)
      if (res.success) {
        toast.success('Successfully booked!')
        router.refresh()
      } else {
        toast.error(res.error)
      }
    } catch (_err) {
      toast.error('Failed to book')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-blue-100 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-full bg-blue-100 px-3 py-1 text-[10px] font-black tracking-widest text-blue-700 uppercase">
          {run.moduleTag || 'General'}
        </span>
        <span className="text-lg font-black text-slate-900 dark:text-white">€{Number(run.price).toFixed(2)}</span>
      </div>

      <h3 className="mb-2 text-lg font-bold leading-tight text-slate-900 dark:text-slate-100">{run.title}</h3>
      <p className="mb-6 flex-1 text-sm text-slate-500 line-clamp-2">{run.description || 'No description provided.'}</p>

      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
          <Calendar className="h-4 w-4 text-blue-600" />
          <span>
            {format(new Date(run.startDatetime), 'EEE, MMM d')} • {format(new Date(run.startDatetime), 'HH:mm')}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
          <Users className="h-4 w-4 text-blue-600" />
          <span>
            {run.currentEnrollments} / {run.capacity} enrolled
          </span>
        </div>
      </div>

      {isBooked ? (
        <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 py-3 text-sm font-bold text-emerald-600 dark:bg-emerald-500/10">
          <CheckCircle2 className="h-4 w-4" />
          You are enrolled
        </div>
      ) : (
        <Button
          onClick={handleBookClick}
          disabled={loading || run.currentEnrollments >= run.capacity}
          className="w-full rounded-xl bg-blue-800 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : run.currentEnrollments >= run.capacity ? (
            'Fully Booked'
          ) : (
            'Book Session'
          )}
        </Button>
      )}

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Confirm Session Booking"
        description={`Are you sure you want to book "${run.title}" for €${Number(run.price).toFixed(2)}? This will be deducted from your wallet balance.`}
        confirmLabel="Book Now"
        cancelLabel="Cancel"
        onConfirm={executeBook}
        loading={loading}
      />
    </div>
  )
}
