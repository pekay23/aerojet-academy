import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FileCheck, Users, Calendar, MapPin, Wallet, Info } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import JoinPoolButton from './_components/JoinPoolButton'
import StandaloneBooking from './_components/StandaloneBooking'
import { getSystemSetting } from '@/lib/settings'

export const metadata: Metadata = { title: 'Exam Pools | Student Portal' }

export default async function ExamPoolsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  // 1. Fetch available pools with membership data for module breakdown
  const [pools, wallet, studentProfile, individualFeeStr] = await Promise.all([
    prisma.examPool.findMany({
      where: {
        status: { in: ['OPEN', 'NEAR_FULL', 'CONFIRMED', 'DRAFT'] },
        event: { status: { in: ['OPEN', 'CONFIRMED', 'DRAFT'] } },
      },
      include: {
        event: true,
        memberships: {
          where: { status: { in: ['RESERVED', 'CONFIRMED'] } },
          select: { examComponentId: true, examComponent: { select: { course: { select: { code: true } } } } },
        },
      },
      orderBy: { examDate: 'asc' },
    }),
    prisma.wallet.findUnique({
      where: { userId: session.user.id },
    }),
    prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
    }),
    getSystemSetting('individual_exam_fee', '520'),
  ])

  const balance = Number(wallet?.availableBalance || 0)
  const { getCurrencySymbol } = await import('@/lib/currency')
  const currency = wallet?.currency || 'EUR'
  const currencySymbol = getCurrencySymbol(currency)
  const individualFee = Number(individualFeeStr)

  // 3. Fetch existing memberships to disable join button
  const myMemberships = await prisma.poolMembership.findMany({
    where: { userId: session.user.id, status: { in: ['RESERVED', 'CONFIRMED'] } },
    select: { poolId: true, examComponentId: true },
  })
  const joinedPoolIds = new Set(myMemberships.map((m) => m.poolId))

  const isExamOnly = studentProfile?.enrollmentType === 'EXAM_ONLY'

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
            Exam Pools
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Join a pool to secure your seat for upcoming exams.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isExamOnly && (
            <StandaloneBooking
              price={individualFee}
              currency={currency}
              availableBalance={balance}
            />
          )}
          <Link
            href="/student/exam-pools/my-bookings"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <FileCheck className="h-4 w-4" />
            My Bookings
          </Link>
        </div>
      </div>

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
            <div
              className={`rounded-lg p-2 ${
                balance > 0
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
              }`}
            >
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                Available Funds
              </p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                {currencySymbol}
                {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            {balance === 0 && (
              <Link
                href="/student/wallet/top-up"
                className="ml-auto text-xs font-bold text-amber-600 hover:underline dark:text-amber-400"
              >
                Top up to join →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* How It Works info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/40 px-5 py-4 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-900/10 dark:text-blue-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <span>
          Each pool accepts <strong>25–28 candidates</strong>, up to{' '}
          <strong>4 different EASA modules</strong> per pool. You select one module per seat. Seat
          fee is reserved from your wallet and released if the pool is cancelled.
        </span>
      </div>

      {/* Pool Cards */}
      {pools.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pools.map((pool) => {
            const isJoined = joinedPoolIds.has(pool.id)
            const seatPrice = Number(pool.seatPrice)
            const canAfford = balance >= seatPrice
            const isFull = pool.currentMemberCount >= pool.maxCandidates

            // Compute unique modules in this pool
            const existingModules = [
              ...new Set(
                pool.memberships
                  .map((m) => m.examComponent?.course?.code)
                  .filter((m): m is string => !!m)
              ),
            ]

            return (
              <div
                key={pool.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Status Banner */}
                <div
                  className={`px-6 py-2 text-[10px] font-black tracking-widest text-white uppercase ${
                    pool.status === 'NEAR_FULL'
                      ? 'bg-amber-500'
                      : pool.status === 'DRAFT'
                        ? 'bg-slate-500'
                        : pool.status === 'CONFIRMED'
                          ? 'bg-blue-600'
                          : 'bg-aerojet-blue'
                  }`}
                >
                  {pool.status === 'DRAFT' ? 'Upcoming' : pool.status.replace('_', ' ')}
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <h3 className="mb-1 text-lg font-black text-slate-900 dark:text-slate-100">
                    {pool.name}
                  </h3>
                  <p className="mb-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                    {pool.event?.name}
                  </p>

                  <div className="mb-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>
                        {new Date(pool.examDate).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span>{pool.event?.location || 'Main Campus'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span>
                        {pool.currentMemberCount} / {pool.maxCandidates} Seats
                      </span>
                    </div>
                  </div>

                  {/* Module breakdown */}
                  {existingModules.length > 0 && (
                    <div className="mb-4 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800/50">
                      <p className="mb-1.5 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                        Modules in pool ({existingModules.length}/4)
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {existingModules.map((m) => (
                          <span
                            key={m}
                            className="bg-aerojet-blue/10 text-aerojet-blue inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold dark:bg-blue-900/30 dark:text-blue-300"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-4 dark:border-slate-800">
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        Seat Price
                      </p>
                      <p className="text-aerojet-blue text-lg font-black dark:text-blue-400">
                        {currencySymbol}
                        {seatPrice.toFixed(2)}
                      </p>
                    </div>

                    {isJoined ? (
                      <button
                        disabled
                        className="rounded-xl bg-emerald-100 px-4 py-2 text-xs font-bold tracking-wide text-emerald-700 uppercase dark:bg-emerald-900/30 dark:text-emerald-400"
                      >
                        Joined ✓
                      </button>
                    ) : (
                      <JoinPoolButton
                        poolId={pool.id}
                        poolName={pool.name}
                        price={seatPrice}
                        currency={currency}
                        canAfford={canAfford}
                        availableBalance={balance}
                        currentModules={existingModules}
                        isFull={isFull}
                      />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm dark:bg-slate-900">
            <FileCheck className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            No pools available
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Check back later for new exam pool openings.
          </p>
        </div>
      )}
    </div>
  )
}
