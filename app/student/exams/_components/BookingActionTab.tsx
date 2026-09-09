import { redirect } from 'next/navigation'
import { Wallet, Package } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getExamPricingConfig } from '@/lib/pools/pricing-config'
import {
  filterForStudentTargets,
  getStudentTargetCategoryCodes,
} from '@/lib/easa/category-selection'

import GroupBookingModal from './GroupBookingModal'
import StandaloneBooking from './StandaloneBooking'
import BundleBooking from './BundleBooking'

/* ── Helper: fetch active bundle for a user ── */
async function getUserActiveBundle(userId: string) {
  const bundle = await prismaUnfiltered.examBundle.findFirst({
    where: {
      userId: userId,
      status: 'ACTIVE',
      validUntil: { gt: new Date() },
    },
    select: {
      id: true,
      bundleType: true,
      totalSeats: true,
      usedSeats: true,
    },
  })
  if (!bundle) return null
  // Only consider it "active" if seats remain
  if (bundle.usedSeats >= bundle.totalSeats) return null
  // Normalize bundleType to canonical form (DB may store FOUR_PACK or FOUR_SEAT)
  return {
    ...bundle,
    bundleType: normalizeBundleType(bundle.bundleType),
  }
}

/** Normalize the raw DB bundleType string to a canonical form. */
function normalizeBundleType(t: string): 'TWO_SEAT' | 'FOUR_SEAT' {
  if (t === 'TWO_SEAT' || t === 'TWIN_PACK') return 'TWO_SEAT'
  return 'FOUR_SEAT'
}

/* ── Helper: fetch common booking data ── */
async function getBookingData(userId: string) {
  const [wallet, pricing, openEvents, upcomingExams, examComponents] = await Promise.all([
    prismaUnfiltered.wallet.findUnique({ where: { userId } }),
    getExamPricingConfig(),
    prismaUnfiltered.examEvent.findMany({
      where: {
        status: { in: ['OPEN', 'DRAFT'] },
        joinDeadline: { gt: new Date() },
      },
      select: { id: true, name: true, startDate: true, endDate: true },
      orderBy: { startDate: 'asc' },
    }),
    prismaUnfiltered.exam.findMany({
      where: { examDate: { gt: new Date() } },
      select: {
        id: true,
        name: true,
        examDate: true,
        examComponent: { select: { course: { select: { code: true, name: true } } } },
      },
      orderBy: { examDate: 'asc' },
    }),
    prismaUnfiltered.examComponent.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        categoryCode: true,
        type: true,
        questionCount: true,
        course: { select: { code: true, name: true } },
      },
      orderBy: { course: { code: 'asc' } },
    }),
  ])
  const { getCurrencySymbol } = await import('@/lib/currency')
  const targetCategories = await getStudentTargetCategoryCodes(prismaUnfiltered, userId)
  const eligibleComponents = filterForStudentTargets(examComponents, targetCategories)
  const balance = Number(wallet?.availableBalance || 0)
  const currency = wallet?.currency || 'EUR'
  const currencySymbol = getCurrencySymbol(currency)
  const ecMapped = eligibleComponents
    .map((ec) => ({
      id: ec.id,
      code: ec.code,
      name: ec.name,
      type: ec.type,
      categoryCode: ec.categoryCode,
      questionCount: ec.questionCount,
      courseCode: ec.course.code,
      courseName: ec.course.name,
    }))
    .sort(
      (a, b) =>
        a.courseCode.localeCompare(b.courseCode, undefined, {
          numeric: true,
          sensitivity: 'base',
        }) || a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' })
    )

  return {
    wallet,
    pricing,
    openEvents,
    upcomingExams,
    examComponents: ecMapped,
    balance,
    currency,
    currencySymbol,
  }
}

export default async function BookingActionTab({
  type,
}: {
  type: 'group' | 'individual' | 'twin' | 'four-pack'
}) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const [userBundle, bookingData] = await Promise.all([
    getUserActiveBundle(session.user.id),
    getBookingData(session.user.id),
  ])

  const {
    wallet: _wallet,
    pricing,
    openEvents,
    upcomingExams,
    examComponents,
    balance,
    currency,
    currencySymbol,
  } = bookingData

  const bundleRemaining = userBundle ? userBundle.totalSeats - userBundle.usedSeats : 0

  const BOOKING_META: Record<string, { title: string; description: string; color: string }> = {
    group: {
      title: 'Group Booking',
      description:
        '1 rep for companies/entities/bulk individuals who books for the companies. Create a custom group charter for your organization or study group.',
      color: 'blue',
    },
    individual: {
      title: 'Individual Booking',
      description:
        'Choose between a single seat, twin pack, or 4-pack. All individual bookings are auto-assigned to a pool by the booking deadline.',
      color: 'emerald',
    },
  }

  const meta = BOOKING_META[type]
  const colorClasses: Record<string, string> = {
    blue: 'border-l-blue-500 bg-blue-50/30 dark:bg-blue-900/10',
    emerald: 'border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10',
  }
  const btnColors: Record<string, string> = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    emerald: 'bg-emerald-600 hover:bg-emerald-700',
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
    amber: 'bg-amber-600 hover:bg-amber-700',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className={`rounded-xl border border-l-4 border-slate-100 p-5 ${colorClasses[meta.color]} dark:border-slate-800`}
      >
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">{meta.title}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{meta.description}</p>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <Wallet className="h-4 w-4 text-slate-400" />
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Available: {currencySymbol}
            {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Bundle seats available banner (only in individual mode) */}
      {type !== 'group' && bundleRemaining > 0 && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-5 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
        >
          <Package className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          <span className="font-black">
            You have {bundleRemaining} remaining seat{bundleRemaining !== 1 ? 's' : ''} in your{' '}
            {userBundle!.bundleType === 'TWO_SEAT' ? 'Twin Pack' : '4-Pack'}.
          </span>{' '}
          Use the &quot;
          {userBundle!.bundleType === 'TWO_SEAT' ? 'Use My Twin Pack' : 'Use My 4-Pack'}&quot;
          button below to book at no extra cost.
        </div>
      )}

      {/* Booking Form / Options */}
      <div
        className={`grid gap-6 sm:grid-cols-1 ${type === 'group' ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}
      >
        {type === 'group' ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-lg font-bold">Group Charter</h3>
            <p className="mb-6 text-sm text-slate-500">
              Book a full exam session for up to 28 candidates.
            </p>
            <GroupBookingModal
              events={openEvents}
              examComponents={examComponents}
              groupCharterFee={pricing.groupCharterFee}
              currency={currency}
              availableBalance={balance}
              trigger={
                <button
                  className={`w-full rounded-xl py-3 text-sm font-bold text-white transition-all active:scale-[0.98] ${btnColors.blue}`}
                >
                  Configure Group Booking
                </button>
              }
            />
          </div>
        ) : (
          <>
            {/* Single Seat */}
            <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold">Single Seat</h3>
                <span className="text-lg font-black text-emerald-600">
                  {currencySymbol}
                  {pricing.individualExamFee}
                </span>
              </div>
              <p className="mb-6 flex-1 text-sm text-slate-500">
                Book a single exam seat and join the auto-pool.
              </p>
              <StandaloneBooking
                pricing={pricing}
                currency={currency}
                availableBalance={balance}
                upcomingExams={upcomingExams}
                examComponents={examComponents}
                events={openEvents}
                existingBundle={
                  userBundle
                    ? {
                        ...userBundle,
                        bundleType: userBundle.bundleType as 'TWO_SEAT' | 'FOUR_SEAT',
                      }
                    : null
                }
                trigger={
                  <button
                    className={`w-full rounded-xl py-3 text-sm font-bold text-white transition-all active:scale-[0.98] ${btnColors.emerald}`}
                  >
                    Book Single Seat
                  </button>
                }
              />
            </div>

            {/* Twin Pack */}
            <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold">Twin Pack</h3>
                <span className="text-lg font-black text-indigo-600">
                  {currencySymbol}
                  {pricing.twoSeatBundle}
                </span>
              </div>
              <p className="mb-6 flex-1 text-sm text-slate-500">
                Bundle 2 exam seats at a discounted rate.
              </p>
              <BundleBooking
                bundleSize={2}
                bundlePrice={pricing.twoSeatBundle}
                individualPrice={pricing.individualExamFee}
                currency={currency}
                availableBalance={balance}
                events={openEvents}
                examComponents={examComponents}
                existingBundle={
                  userBundle && userBundle.bundleType === 'TWO_SEAT'
                    ? {
                        ...userBundle,
                        bundleType: userBundle.bundleType as 'TWO_SEAT' | 'FOUR_SEAT',
                      }
                    : null
                }
                trigger={
                  <button
                    className={`w-full rounded-xl py-3 text-sm font-bold text-white transition-all active:scale-[0.98] ${
                      userBundle && userBundle.bundleType === 'TWO_SEAT' && bundleRemaining > 0
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : btnColors.indigo
                    }`}
                  >
                    {userBundle && userBundle.bundleType === 'TWO_SEAT' && bundleRemaining > 0
                      ? `Use My Twin Pack (${bundleRemaining} left)`
                      : 'Purchase Twin Pack'}
                  </button>
                }
              />
            </div>

            {/* 4-Pack */}
            <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold">4-Pack</h3>
                <span className="text-lg font-black text-amber-600">
                  {currencySymbol}
                  {pricing.fourSeatBundle}
                </span>
              </div>
              <p className="mb-6 flex-1 text-sm text-slate-500">
                Best value — 4 exam seats for maximum flexibility.
              </p>
              <BundleBooking
                bundleSize={4}
                bundlePrice={pricing.fourSeatBundle}
                individualPrice={pricing.individualExamFee}
                currency={currency}
                availableBalance={balance}
                events={openEvents}
                examComponents={examComponents}
                existingBundle={
                  userBundle && userBundle.bundleType === 'FOUR_SEAT'
                    ? {
                        ...userBundle,
                        bundleType: userBundle.bundleType as 'TWO_SEAT' | 'FOUR_SEAT',
                      }
                    : null
                }
                trigger={
                  <button
                    className={`w-full rounded-xl py-3 text-sm font-bold text-white transition-all active:scale-[0.98] ${
                      userBundle && userBundle.bundleType === 'FOUR_SEAT' && bundleRemaining > 0
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : btnColors.amber
                    }`}
                  >
                    {userBundle && userBundle.bundleType === 'FOUR_SEAT' && bundleRemaining > 0
                      ? `Use My 4-Pack (${bundleRemaining} left)`
                      : 'Purchase 4-Pack'}
                  </button>
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
