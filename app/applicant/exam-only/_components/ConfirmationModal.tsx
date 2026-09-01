import { Wallet } from 'lucide-react'

export interface ConfirmationBooking {
  componentId: string
  type: 'POOL' | 'INDIVIDUAL'
  price: number
  moduleName: string
}

interface ConfirmationModalProps {
  booking: ConfirmationBooking | null
  onCancel: () => void
  onConfirm: () => void
}

export default function ConfirmationModal({
  booking,
  onCancel,
  onConfirm,
}: ConfirmationModalProps) {
  if (!booking) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900">
        <div className="border-b border-slate-100 p-6 dark:border-slate-800">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Confirm Booking
          </h3>
          <p className="mt-1 text-sm text-slate-500">Are you sure you want to book this exam seat?</p>
        </div>
        <div className="space-y-4 p-6">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">Module</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
              {booking.moduleName}
            </p>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-900 dark:text-blue-100">
                {booking.type === 'POOL' ? 'Pool Seat' : 'Individual Seat'}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">Fee</p>
              <p className="text-lg font-black text-blue-700 dark:text-blue-400">
                €{booking.price.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 border-t border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700"
          >
            Confirm & Pay
          </button>
        </div>
      </div>
    </div>
  )
}
