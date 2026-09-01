import { Package, Loader2 } from 'lucide-react'
import { ExamBundle, ExamOnlyPrices } from './examOnlyTypes'
import { formatDate } from '@/lib/utils/date'

interface PackagesTabProps {
  bundles: ExamBundle[]
  purchasingBundle: string | null
  onSelectIndividual: () => void
  onSelectPool: () => void
  onSelectBundle: (type: 'TWO_SEAT' | 'FOUR_SEAT') => void
  fmt: (amount: number) => string
  prices: ExamOnlyPrices
}

export default function PackagesTab({
  bundles,
  purchasingBundle,
  onSelectIndividual,
  onSelectPool,
  onSelectBundle,
  fmt,
  prices,
}: PackagesTabProps) {
  const twinSave = Math.max(0, prices.individual * 2 - prices.twoSeat)
  const fourSave = Math.max(0, prices.individual * 4 - prices.fourSeat)

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Individual Seat Option */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h3 className="mb-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Individual Seat
            </h3>
            <p className="mb-4 text-sm text-slate-500">
              Book a single, guaranteed individual exam seat at your preferred time.
            </p>
            <div className="mb-6 text-3xl font-black text-slate-900 dark:text-white">
              {fmt(prices.individual)}
            </div>
          </div>
          <button
            onClick={onSelectIndividual}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Select Module
          </button>
        </div>

        {/* Pool Seat Option */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h3 className="mb-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Exam Booking Seat
            </h3>
            <p className="mb-4 text-sm text-slate-500">
              Join an existing exam booking to save money on your exam seating. Best for flexible
              schedules.
            </p>
            <div className="mb-6 text-3xl font-black text-aerojet-sky">{fmt(prices.pool)}</div>
          </div>
          <button
            onClick={onSelectPool}
            className="w-full rounded-xl border border-aerojet-sky bg-aerojet-sky/10 py-3 text-sm font-bold text-aerojet-sky transition-all hover:bg-aerojet-sky/20"
          >
            Join an Exam Booking
          </button>
        </div>

        {/* Twin Pack Option */}
        <div className="flex flex-col justify-between rounded-2xl border-2 border-indigo-500 bg-white p-6 shadow-lg shadow-indigo-100 dark:border-indigo-600 dark:bg-slate-900 dark:shadow-none">
          <div className="relative">
            <span className="absolute -top-2 -right-2 rounded-full bg-indigo-500 px-3 py-1 text-xs font-bold text-white">
              Save {fmt(twinSave)}
            </span>
            <h3 className="mb-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Twin Pack
            </h3>
            <p className="mb-4 text-sm text-slate-500">
              Buy 2 individual exam seats upfront. Guaranteed seating whenever you are ready.
              Valid for 12 months.
            </p>
            <div className="mb-1 text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {fmt(prices.twoSeat)}
            </div>
            <div className="mb-6 text-xs text-slate-400 line-through">
              {fmt(prices.individual * 2)} (2x {fmt(prices.individual)})
            </div>
          </div>
          <button
            onClick={() => onSelectBundle('TWO_SEAT')}
            disabled={purchasingBundle !== null}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-700 disabled:opacity-50"
          >
            {purchasingBundle === 'TWO_SEAT' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Package className="h-4 w-4" />
            )}
            Select Twin Pack Modules
          </button>
        </div>

        {/* 4-Pack Option */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white bg-linear-to-br from-white to-amber-50 p-6 dark:border-slate-800 dark:bg-slate-900 dark:from-slate-900 dark:to-slate-800">
          <div className="relative">
            <span className="absolute -top-2 -right-2 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">
              Save {fmt(fourSave)} + 1 Free Change
            </span>
            <h3 className="mb-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              4-Pack
            </h3>
            <p className="mb-4 text-sm text-slate-500">
              The ultimate individual seating package. Secure 4 guaranteed seats + 1 free module
              change. Valid for 12 months.
            </p>
            <div className="mb-1 text-3xl font-black text-amber-600">{fmt(prices.fourSeat)}</div>
            <div className="mb-6 text-xs text-slate-400 line-through">
              {fmt(prices.individual * 4)} (4x {fmt(prices.individual)})
            </div>
          </div>
          <button
            onClick={() => onSelectBundle('FOUR_SEAT')}
            disabled={purchasingBundle !== null}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-bold text-white transition-all hover:bg-amber-600 disabled:opacity-50"
          >
            {purchasingBundle === 'FOUR_SEAT' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Package className="h-4 w-4" />
            )}
            Select 4-Pack Modules
          </button>
        </div>
      </div>

      {/* Show Active Bundles if any */}
      {bundles.length > 0 && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="mb-4 font-bold text-slate-900 dark:text-slate-100">My Exam Packages</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bundles.map((bundle) => (
              <div
                key={bundle.id}
                className="rounded-xl border border-slate-100 p-4 dark:border-slate-800"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {bundle.bundleType === 'TWO_SEAT' ? 'Twin Pack' : '4-Pack'}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${bundle.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {bundle.status}
                  </span>
                </div>
                <div className="mb-3 text-sm text-slate-500">
                  Seats Remaining: <strong>{bundle.totalSeats - bundle.usedSeats}</strong> /{' '}
                  {bundle.totalSeats}
                </div>
                <div className="text-xs text-slate-400">
                  Valid until {formatDate(bundle.validUntil)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
