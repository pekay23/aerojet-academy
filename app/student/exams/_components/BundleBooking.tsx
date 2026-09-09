'use client'

import { useState, useTransition } from 'react'
import { bookBundleExamsAtomicAction, useExistingBundleSeatsAction } from '@/app/student/actions'
import { toast } from 'sonner'
import {
  Loader2,
  ArrowRight,
  BookOpen,
  Wallet,
  Calendar,
  X,
  Package,
  Info,
  ChevronDown,
} from 'lucide-react'
import { getCurrencySymbol } from '@/lib/currency'

interface ExamComponent {
  id: string
  code: string
  name: string
  type?: 'MCQ' | 'ESSAY'
  categoryCode?: string | null
  questionCount?: number | null
  courseCode?: string
  courseName?: string
}

interface ExamEvent {
  id: string
  name: string
  startDate: Date
  endDate: Date
}

interface BundleBookingProps {
  bundleSize: 2 | 4
  bundlePrice: number
  individualPrice: number
  currency: string
  availableBalance: number
  events: ExamEvent[]
  examComponents: ExamComponent[]
  trigger?: React.ReactNode
  /**
   * If provided, the modal operates in "use existing bundle" mode:
   * seats are consumed from this bundle instead of charging the wallet.
   * The max selectable modules is capped at the remaining seats.
   */
  existingBundle?: {
    id: string
    bundleType: 'TWO_SEAT' | 'FOUR_SEAT'
    totalSeats: number
    usedSeats: number
  } | null
}

export default function BundleBooking({
  bundleSize,
  bundlePrice,
  individualPrice,
  currency,
  availableBalance,
  events,
  examComponents,
  trigger,
  existingBundle,
}: BundleBookingProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '')

  const currencySymbol = getCurrencySymbol(currency)
  const canAfford = availableBalance >= bundlePrice
  const savings = individualPrice * bundleSize - bundlePrice
  const isExistingBundle = !!existingBundle
  const remainingSeats = existingBundle
    ? existingBundle.totalSeats - existingBundle.usedSeats
    : bundleSize
  // When using an existing bundle, cap the required module count at remaining seats.
  // Otherwise require exactly bundleSize modules.
  const requiredModules = isExistingBundle ? remainingSeats : bundleSize
  const bundleLabel = isExistingBundle
    ? existingBundle.bundleType === 'TWO_SEAT'
      ? 'Use My Twin Pack'
      : 'Use My 4-Pack'
    : bundleSize === 2
      ? 'Book Twin Pack'
      : 'Book 4 Pack'
  const shortLabel = isExistingBundle
    ? existingBundle.bundleType === 'TWO_SEAT'
      ? 'Twin'
      : '4-Pk'
    : bundleSize === 2
      ? 'Twin'
      : '4-Pk'

  const toggleModule = (code: string) => {
    setSelectedModules((prev) => {
      if (prev.includes(code)) return prev.filter((m) => m !== code)
      if (prev.length >= requiredModules) return prev
      return [...prev, code]
    })
  }

  /** Group exam components by course code, then by type + category. */
  interface ModuleGroup {
    courseCode: string
    courseName: string
    groups: {
      label: string
      items: ExamComponent[]
    }[]
  }
  const groupedModules = (() => {
    const byCourse = new Map<string, ModuleGroup>()
    for (const ec of examComponents) {
      const cc = ec.courseCode || 'Other'
      if (!byCourse.has(cc)) {
        byCourse.set(cc, {
          courseCode: cc,
          courseName: ec.courseName || cc,
          groups: [],
        })
      }
      const g = byCourse.get(cc)!
      const typeLabel = ec.type === 'ESSAY' ? 'Essay' : 'MCQ'
      const catLabel = ec.categoryCode ? `Cat ${ec.categoryCode}` : ''
      const subKey = [typeLabel, catLabel].filter(Boolean).join(' · ')
      let sub = g.groups.find((s) => s.label === subKey)
      if (!sub) {
        sub = { label: subKey, items: [] }
        g.groups.push(sub)
      }
      sub.items.push(ec)
    }
    for (const g of byCourse.values()) {
      g.groups.sort((a, b) => a.label.localeCompare(b.label))
    }
    // Sort courses by numeric portion so M1, M2, M10 (not M1, M10, M2),
    // then by full code so M11A, M11B, M11C are ordered correctly.
    return [...byCourse.values()].sort((a, b) => {
      const na = parseInt(a.courseCode.match(/\d+/)?.[0] || '0', 10)
      const nb = parseInt(b.courseCode.match(/\d+/)?.[0] || '0', 10)
      if (na !== nb) return na - nb
      return a.courseCode.localeCompare(b.courseCode, undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    })
  })()

  /** Track which course accordions are expanded. */
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(() => {
    const s = new Set<string>()
    for (const g of groupedModules) s.add(g.courseCode)
    return s
  })

  const toggleCourse = (cc: string) => {
    setExpandedCourses((prev) => {
      const next = new Set(prev)
      if (next.has(cc)) next.delete(cc)
      else next.add(cc)
      return next
    })
  }

  const handleSubmit = () => {
    if (selectedModules.length !== requiredModules) {
      toast.error(
        isExistingBundle
          ? `Please select exactly ${requiredModules} module${requiredModules !== 1 ? 's' : ''} to use your remaining seats.`
          : `Please select exactly ${requiredModules} modules for your ${bundleLabel}.`
      )
      return
    }
    if (!selectedEventId) {
      toast.error('Please select a target exam event.')
      return
    }

    startTransition(async () => {
      try {
        let res
        if (isExistingBundle && existingBundle) {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          res = await useExistingBundleSeatsAction({
            moduleCodes: selectedModules,
            eventId: selectedEventId,
            bundleId: existingBundle.id,
          })
        } else {
          res = await bookBundleExamsAtomicAction({
            moduleCodes: selectedModules,
            eventId: selectedEventId,
          })
        }
        if (res.error) {
          toast.error(res.error)
          return
        }
        toast.success(
          isExistingBundle
            ? `${selectedModules.length} exam seat${selectedModules.length !== 1 ? 's' : ''} confirmed from your bundle!`
            : `${bundleLabel} booked successfully! ${bundleSize} exam seats reserved.`
        )
        setOpen(false)
        setSelectedModules([])
      } catch {
        toast.error('Something went wrong. Please try again.')
      }
    })
  }

  return (
    <>
      {trigger ? (
        <div
          onClick={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setOpen(true)
            }
          }}
          role="button"
          tabIndex={0}
          className="cursor-pointer"
        >
          {trigger}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className={`flex items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-bold transition-all active:scale-95 ${
            bundleSize === 2
              ? 'border-blue-200 bg-blue-50/50 text-blue-700 hover:border-blue-300 hover:bg-blue-100/50 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
              : 'border-purple-200 bg-purple-50/50 text-purple-700 hover:border-purple-300 hover:bg-purple-100/50 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
          }`}
        >
          <span className="hidden sm:inline">{bundleLabel}</span>
          <span className="sm:hidden">{shortLabel}</span>
          {!isExistingBundle && (
            <span className="text-xs opacity-70">
              ({currencySymbol}
              {bundlePrice.toFixed(2)})
            </span>
          )}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => !isPending && setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bundle-booking-title"
            aria-describedby="bundle-booking-description"
            onKeyDown={(e) => {
              if (e.key === 'Escape' && !isPending) setOpen(false)
            }}
            className="relative z-10 w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-8 py-6 dark:border-slate-800">
              <div>
                <h2
                  id="bundle-booking-title"
                  className="text-xl font-black tracking-tight text-blue-800 dark:text-white"
                >
                  {bundleLabel}
                </h2>
                <p
                  id="bundle-booking-description"
                  className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400"
                >
                  {isExistingBundle
                    ? `Select ${requiredModules} module${requiredModules !== 1 ? 's' : ''} to use your remaining seats (no charge).`
                    : `Select ${bundleSize} modules for your bundle.`}
                </p>
              </div>
              <button
                onClick={() => !isPending && setOpen(false)}
                aria-label="Close dialog"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-800"
                disabled={isPending}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid max-h-[75vh] grid-cols-1 gap-6 overflow-y-auto p-8 lg:grid-cols-2">
              {/* Left column: Pricing + Event + Info */}
              <div className="space-y-6">
                {/* Pricing Summary */}
                <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-5 dark:border-blue-800 dark:bg-blue-900/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                    <Package className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      {isExistingBundle ? 'Cost' : 'Total Bundle Price'}
                    </p>
                    <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">
                      {isExistingBundle
                        ? `${currencySymbol}0.00`
                        : `${currencySymbol}${bundlePrice.toFixed(2)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    {isExistingBundle ? (
                      <p className="mb-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black tracking-tight text-emerald-800 uppercase dark:bg-emerald-900/40 dark:text-emerald-300">
                        Using Package
                      </p>
                    ) : (
                      <>
                        <p className="mb-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black tracking-tight text-emerald-800 uppercase dark:bg-emerald-900/40 dark:text-emerald-300">
                          Save {currencySymbol}
                          {savings.toFixed(2)}
                        </p>
                        <p className="text-xs font-medium text-slate-500">
                          Just {currencySymbol}
                          {(bundlePrice / bundleSize).toFixed(0)}/seat
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Event Selection */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-black tracking-tight text-slate-700 uppercase dark:text-slate-200">
                    <Calendar className="h-4 w-4 text-blue-800" />
                    Target Exam Event
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    disabled={isPending}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">-- Select an event --</option>
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Info note */}
                <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <p className="text-[10px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                    Bundle seats are auto-assigned to pools by the enrollment deadline. You can
                    update your module selection from the <strong>My Bookings</strong> tab before
                    the deadline.
                  </p>
                </div>

                {!canAfford && (
                  <div className="flex items-start gap-4 rounded-2xl border border-amber-100 bg-amber-50/50 p-5 dark:border-amber-900/30 dark:bg-amber-900/20">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div className="text-xs leading-relaxed font-medium text-amber-800 dark:text-amber-300">
                      <p className="mb-1 font-black tracking-tight uppercase">
                        Insufficient Wallet Balance
                      </p>
                      Your current balance is{' '}
                      <strong>
                        {currencySymbol}
                        {availableBalance.toFixed(2)}
                      </strong>
                      . You need an additional{' '}
                      <strong>
                        {currencySymbol}
                        {(bundlePrice - availableBalance).toFixed(2)}
                      </strong>{' '}
                      to complete this purchase.
                    </div>
                  </div>
                )}
              </div>

              {/* Right column: Module Selection */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-black tracking-tight text-slate-700 uppercase dark:text-slate-200">
                  <BookOpen className="h-4 w-4 text-blue-800" />
                  Select {requiredModules} Modules ({selectedModules.length}/{requiredModules})
                </label>
                <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                  {groupedModules.map((course) => {
                    const isExpanded = expandedCourses.has(course.courseCode)
                    const totalInCourse = course.groups.reduce((sum, g) => sum + g.items.length, 0)
                    return (
                      <div
                        key={course.courseCode}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/40"
                      >
                        <button
                          type="button"
                          onClick={() => toggleCourse(course.courseCode)}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/40"
                        >
                          <div className="flex items-center gap-2">
                            <ChevronDown
                              className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            />
                            <span className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100">
                              {course.courseCode}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                              {course.courseName}
                            </span>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                            {totalInCourse}
                          </span>
                        </button>
                        {isExpanded && (
                          <div className="space-y-2 border-t border-slate-100 p-3 dark:border-slate-700/60">
                            {course.groups.map((sub) => (
                              <div key={sub.label} className="space-y-1.5">
                                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                  {sub.label}
                                </p>
                                <div className="grid grid-cols-2 gap-1.5">
                                  {sub.items.map((ec) => {
                                    const isSelected = selectedModules.includes(ec.code)
                                    const isDisabled =
                                      !isSelected && selectedModules.length >= requiredModules
                                    return (
                                      <button
                                        key={ec.id}
                                        type="button"
                                        onClick={() => toggleModule(ec.code)}
                                        disabled={isDisabled || isPending}
                                        className={`group relative rounded-lg border p-2 text-left transition-all ${
                                          isSelected
                                            ? 'border-blue-800 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-900/20'
                                            : isDisabled
                                              ? 'cursor-not-allowed border-slate-100 opacity-40 dark:border-slate-800'
                                              : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-600 dark:hover:bg-slate-800/50'
                                        }`}
                                      >
                                        <p
                                          className={`text-[11px] font-black tracking-tight uppercase ${isSelected ? 'text-blue-800 dark:text-blue-300' : 'text-slate-900 dark:text-slate-100'}`}
                                        >
                                          {ec.code}
                                        </p>
                                        <p className="mt-0.5 line-clamp-1 text-[9px] font-medium text-slate-500 dark:text-slate-400">
                                          {ec.name}
                                          {ec.questionCount ? ` · ${ec.questionCount}q` : ''}
                                        </p>
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Bundle validity note */}
            <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/50 px-5 py-3 text-xs text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-300">
              <Calendar className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                <strong>Bundle validity:</strong> Exam bundles are valid for{' '}
                <strong>12 months</strong> from purchase. Seats are auto-assigned to pools by the
                enrollment deadline. Unused seats do not roll over.
              </span>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white py-4 text-sm font-black text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    isPending ||
                    (!isExistingBundle && !canAfford) ||
                    selectedModules.length !== requiredModules ||
                    !selectedEventId
                  }
                  className="flex flex-[1.5] items-center justify-center gap-2 rounded-2xl bg-blue-800 py-4 text-sm font-black text-white shadow-lg shadow-blue-800/20 transition-all hover:bg-[#003a7c] hover:shadow-xl active:scale-95 disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {isExistingBundle ? 'Confirm Seats' : 'Complete Purchase'}
                      {!isPending && <ArrowRight className="h-5 w-5" />}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
