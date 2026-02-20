import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FileCheck, Users, Calendar, MapPin, Wallet } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import JoinPoolButton from './_components/JoinPoolButton'

export const metadata: Metadata = { title: 'Exam Pools | Student Portal' }

export default async function ExamPoolsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  // 1. Fetch available pools (OPEN or NEAR_FULL)
  const pools = await prisma.examPool.findMany({
    where: {
      status: { in: ['OPEN', 'NEAR_FULL'] },
      event: { status: { in: ['OPEN', 'CONFIRMED'] } },
    },
    include: { event: true },
    orderBy: { examDate: 'asc' },
  })

  // 2. Fetch user's wallet for balance check
  const wallet = await prisma.wallet.findUnique({
    where: { userId: session.user.id },
  })
  const balance = Number(wallet?.availableBalance || 0)

  // 3. Fetch existing memberships to disable join button
  const myMemberships = await prisma.poolMembership.findMany({
    where: { userId: session.user.id },
    select: { poolId: true },
  })
  const joinedPoolIds = new Set(myMemberships.map((m) => m.poolId))

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Exam Pools
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Join a pool to secure your seat for upcoming exams.
          </p>
        </div>
        <Link
          href="/student/exam-pools/my-bookings"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 dark:text-slate-100"
        >
          <FileCheck className="h-4 w-4" />
          My Bookings
        </Link>
      </div>

      {wallet && (
        <div
          className={`rounded-xl border border-l-4 p-4 ${balance > 0 ? 'border-slate-100 border-l-blue-500 bg-blue-50/20' : 'border-amber-100 border-l-amber-500 bg-amber-50'}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`rounded-lg p-2 ${balance > 0 ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}
            >
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Available Funds
              </p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                {wallet.currency} {balance.toFixed(2)}
              </p>
            </div>
            {balance === 0 && (
              <Link
                href="/student/wallet/top-up"
                className="ml-auto text-xs font-bold text-amber-600 hover:underline"
              >
                Top up to join →
              </Link>
            )}
          </div>
        </div>
      )}

      {pools.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pools.map((pool) => {
            const isJoined = joinedPoolIds.has(pool.id)
            const seatPrice = Number(pool.seatPrice)
            const canAfford = balance >= seatPrice

            return (
              <div
                key={pool.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
              >
                {/* Status Banner */}
                <div
                  className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white ${
                    pool.status === 'NEAR_FULL' ? 'bg-amber-500' : 'bg-[#002a5c]'
                  }`}
                >
                  {pool.status.replace('_', ' ')}
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <h3 className="mb-1 text-lg font-black text-slate-900 dark:text-slate-100">{pool.name}</h3>
                  <p className="mb-4 text-xs font-bold text-slate-500 dark:text-slate-400">{pool.event?.name}</p>

                  <div className="mb-6 space-y-3">
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

                  <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Seat Price
                      </p>
                      <p className="text-lg font-black text-[#002a5c]">{seatPrice.toFixed(2)}</p>
                    </div>

                    {isJoined ? (
                      <button
                        disabled
                        className="rounded-xl bg-emerald-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-emerald-700"
                      >
                        Joined
                      </button>
                    ) : (
                      <JoinPoolButton
                        poolId={pool.id}
                        price={seatPrice}
                        currency={wallet?.currency || 'EUR'}
                        canAfford={canAfford}
                      />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-slate-900 text-slate-300 shadow-sm">
            <FileCheck className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No pools available</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            Check back later for new exam pool openings.
          </p>
        </div>
      )}
    </div>
  )
}

