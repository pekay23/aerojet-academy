import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FileCheck, Users, Calendar, MapPin, Wallet, Info, AlertCircle } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { getExamPricingConfig } from '@/lib/pools/pricing-config'
import JoinPoolButton from './JoinPoolButton'
import { ACTIVE_MEMBERSHIP_STATUSES } from '@/lib/utils/constants'
import { filterForStudentTargets, getStudentTargetCategoryCodes } from '@/lib/easa/category-selection'

/* ── Helper: fetch common booking data ── */
async function getBookingData(userId: string) {
  const [wallet, pricing, examComponents] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId } }),
    getExamPricingConfig(),
    prisma.examComponent.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        categoryCode: true,
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
  const ecMapped = eligibleComponents.map((ec) => ({
    id: ec.id,
    code: ec.code,
    name: ec.name,
    categoryCode: ec.categoryCode,
    questionCount: ec.questionCount,
    courseCode: ec.course.code,
    courseName: ec.course.name,
  })).sort((a, b) =>
    a.courseCode.localeCompare(b.courseCode, undefined, { numeric: true, sensitivity: 'base' }) ||
    a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' })
  )

  return { wallet, pricing, examComponents: ecMapped, balance, currency, currencySymbol }
}

export default async function AvailablePoolsTab() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const [pools, bookingData, myMemberships] = await Promise.all([
    prisma.examPool.findMany({
      where: {
        status: { in: ['OPEN', 'NEAR_FULL', 'CONFIRMED', 'DRAFT'] },
        poolType: 'STANDARD',
        isAutoPool: false,
        name: { not: { contains: 'Auto Pool' } },
        event: { 
          status: { in: ['OPEN', 'CONFIRMED', 'DRAFT'] },
          joinDeadline: { gt: new Date() }
        },
      },
      include: {
        event: true,
        memberships: {
          where: { status: { in: ACTIVE_MEMBERSHIP_STATUSES } },
          select: {
            examComponentId: true,
            examComponent: { select: { course: { select: { code: true } } } },
          },
        },
      },
      orderBy: { examDate: 'asc' },
    }),
    getBookingData(session.user.id),
    prisma.poolMembership.findMany({
      where: { userId: session.user.id, status: { in: ACTIVE_MEMBERSHIP_STATUSES } },
      select: { poolId: true },
    }),
  ])

  const { wallet, balance, currency, currencySymbol, examComponents } = bookingData
  const joinedPoolIds = new Set(myMemberships.map((m) => m.poolId))

  return (
    <div className="space-y-8">
      {/* Wallet Banner */}
      {wallet && (
        <div
          className={`rounded-xl border border-l-4 p-4 ${
            balance > 0
              ? 'border-slate-100 border-l-blue-500 bg-blue-50/20 dark:border-slate-800 dark:bg-blue-900/10'
              : 'border-amber-100 border-l-amber-500 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${balance > 0 ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">Available Funds</p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100">{currencySymbol}{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            {balance === 0 && (
              <Link href="/student/wallet/top-up" className="ml-auto text-xs font-bold text-amber-600 hover:underline dark:text-amber-400">
                Top up to join →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/40 px-5 py-4 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-900/10 dark:text-blue-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <span>
          <strong>Join Available Exam Pools</strong> to take advantage of the cheapest price of the exams (€300/seat). 
          Please note that <strong>there is no refund</strong> until admin refunds the money (or only credits the wallet, not bank) 
          because everyone in the pool is relying on everyone to make the class/seat/pool viable. 
          Each pool accepts <strong>25–28 candidates</strong>.
        </span>
      </div>

      {/* Pool Cards */}
      {pools.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pools.map((pool) => {
            const isJoined = joinedPoolIds.has(pool.id)
            let surcharge = 0
            if (pool.event?.startDate) {
              const daysUntilExam = Math.ceil((pool.event.startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              if (daysUntilExam <= bookingData.pricing.lateBookingDays && daysUntilExam > 0) {
                surcharge = bookingData.pricing.lateBookingSurcharge
              }
            }

            const seatPrice = Number(pool.seatPrice) + surcharge
            const canAfford = balance >= seatPrice
            const isFull = pool.currentMemberCount >= pool.maxCandidates
            const existingModules = [...new Set(pool.memberships.map((m) => m.examComponent?.course?.code).filter((m): m is string => !!m))]
            
            const displayStatus = pool.status === 'DRAFT' ? 'OPEN' : pool.status;

            return (
              <div key={pool.id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                <div className={`flex items-center justify-between px-6 py-2 text-xs font-black tracking-widest text-white uppercase ${displayStatus === 'NEAR_FULL' ? 'bg-amber-500' : displayStatus === 'OPEN' ? 'bg-blue-800' : displayStatus === 'CONFIRMED' ? 'bg-blue-600' : 'bg-slate-500'}`}>
                  <span>{displayStatus.replace('_', ' ')}</span>
                  {pool.timeSlot && <span className="text-white/80">{pool.poolLabel ? `Pool ${pool.poolLabel}` : ''} · Day ${pool.dayNumber} ${pool.timeSlot === 'MORNING' ? 'AM' : 'PM'}</span>}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="mb-1 text-lg font-black text-slate-900 dark:text-slate-100">{pool.name}</h3>
                  <p className="mb-4 text-xs font-bold text-slate-500 dark:text-slate-400">{pool.event?.name}</p>
                  <div className="mb-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><Calendar className="h-4 w-4 text-slate-400" /><span>{new Date(pool.examDate).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><MapPin className="h-4 w-4 text-slate-400" /><span>{pool.event?.location || 'Main Campus'}</span></div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2"><Users className="h-4 w-4 text-slate-400" /><span>{pool.currentMemberCount} / {pool.maxCandidates} Seats</span></div>
                        <span className="text-xs font-bold text-slate-400">{Math.round((pool.currentMemberCount / pool.maxCandidates) * 100)}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className={`h-full transition-all duration-500 ${pool.status === 'NEAR_FULL' ? 'bg-amber-500' : pool.status === 'CONFIRMED' ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${(pool.currentMemberCount / pool.maxCandidates) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                  {existingModules.length > 0 && (
                    <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/50">
                      <p className="mb-1.5 text-xs font-bold tracking-widest text-slate-400 uppercase">Modules in booking ({existingModules.length}/4)</p>
                      <div className="flex flex-wrap gap-1.5">
                        {existingModules.map((m) => (<span key={m} className="bg-blue-800/10 text-blue-800 inline-flex rounded-md px-2 py-0.5 text-xs font-bold dark:bg-blue-900/30 dark:text-blue-300">{m}</span>))}
                      </div>
                    </div>
                  )}
                  {surcharge > 0 && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-2.5 text-[10px] text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 font-bold uppercase tracking-wide flex items-start gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>{currencySymbol}{surcharge} Late Booking Surcharge Applied (T-{bookingData.pricing.lateBookingDays})</span>
                    </div>
                  )}
                  <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-4 dark:border-slate-800">
                    <div>
                      <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Seat Price</p>
                      <p className="text-blue-800 text-lg font-black dark:text-blue-400">{currencySymbol}{seatPrice.toFixed(2)}</p>
                    </div>
                    {isJoined ? (
                      <button disabled className="rounded-xl bg-emerald-100 px-4 py-2 text-xs font-bold tracking-wide text-emerald-700 uppercase dark:bg-emerald-900/30 dark:text-emerald-400">Joined ✓</button>
                    ) : (
                      <JoinPoolButton poolId={pool.id} poolName={pool.name} price={seatPrice} currency={currency} canAfford={canAfford} availableBalance={balance} currentModules={existingModules} isFull={isFull} examComponents={examComponents} />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm dark:bg-slate-900"><FileCheck className="h-8 w-8" /></div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No bookings available</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">Check back later for new exam booking openings.</p>
        </div>
      )}
    </div>
  )
}
