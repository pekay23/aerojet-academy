import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { CalendarDays, Users, MapPin, Clock, BookOpen, Info } from 'lucide-react'
import { Suspense } from 'react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Exam Pools | Applicant Portal' }
export const dynamic = 'force-dynamic'

const poolStatusLabel: Record<string, string> = {
  DRAFT: 'Upcoming',
  OPEN: 'Open',
  NEAR_FULL: 'Nearly Full',
  CONFIRMED: 'Confirmed',
  LOCKED: 'In Progress',
  FAILED: 'Cancelled',
  MERGED: 'Merged',
  COMPLETED: 'Completed',
}

const poolStatusColor: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  OPEN: 'bg-green-100 text-green-700',
  NEAR_FULL: 'bg-orange-100 text-orange-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  LOCKED: 'bg-purple-100 text-purple-700',
  FAILED: 'bg-red-100 text-red-700',
  MERGED: 'bg-slate-100 text-slate-500',
  COMPLETED: 'bg-slate-100 text-slate-500',
}

export default async function ExamPoolsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
          Exam Pools
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          View available examination pools. Enrollment in exam pools requires an active student
          account.
        </p>
      </div>

      {/* Info Banner & CTA */}
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-blue-100 p-2.5">
            <Info className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-900">Credit Your Exam Wallet</p>
            <p className="mt-1 text-sm text-blue-700">
              To join these exam pools, you must first convert your Applicant account to an active
              Student account by crediting your Exam Wallet.
            </p>
          </div>
        </div>
        <Link
          href="/applicant/wallet-top-up"
          className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700"
        >
          Top Up Wallet
        </Link>
      </div>

      <Suspense fallback={<PoolsSkeleton />}>
        <PoolList />
      </Suspense>
    </div>
  )
}

function PoolsSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  )
}

async function PoolList() {
  // Get open/upcoming exam pools
  const pools = await prisma.examPool.findMany({
    where: {
      status: { in: ['OPEN', 'NEAR_FULL', 'CONFIRMED', 'DRAFT'] },
    },
    include: {
      event: {
        select: {
          name: true,
          startDate: true,
          endDate: true,
          location: true,
        },
      },
      _count: { select: { memberships: { where: { status: { in: ['RESERVED', 'CONFIRMED'] } } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })

  if (pools.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm dark:bg-slate-900">
          <BookOpen className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No open exam pools</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          There are currently no active exam pools open for registration. Exam pools will be listed
          here when they become available.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {pools.map((pool) => {
        const currentCount = pool._count.memberships
        const maxCandidates = pool.maxCandidates
        const fillPct = maxCandidates > 0 ? Math.round((currentCount / maxCandidates) * 100) : 0

        return (
          <div
            key={pool.id}
            className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="mb-1 font-mono text-xs font-bold text-slate-400">Exam Pool</p>
                <h2 className="text-base leading-snug font-bold text-slate-900 dark:text-slate-100">
                  {pool.event?.name ?? pool.name ?? 'Exam Pool'}
                </h2>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold tracking-widest uppercase ${poolStatusColor[pool.status] ?? 'bg-slate-100 text-slate-500'}`}
              >
                {poolStatusLabel[pool.status] ?? pool.status}
              </span>
            </div>

            {/* Details */}
            <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              {pool.event?.startDate && (
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {pool.event.startDate.toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              )}
              {pool.event?.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {pool.event.location}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                {currentCount} / {maxCandidates} registered
              </div>
            </div>

            {/* Fill bar */}
            <div>
              <div className="mb-1 flex justify-between text-[10px] text-slate-400">
                <span>Capacity</span>
                <span>{fillPct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${fillPct >= 90 ? 'bg-red-400' : fillPct >= 70 ? 'bg-orange-400' : 'bg-green-400'}`}
                  style={{ width: `${fillPct}%` }}
                />
              </div>
            </div>

            {/* Fee */}
            <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-3">
              <div>
                <p className="text-[10px] text-slate-400">Exam Fee</p>
                <p className="text-base font-black text-[#002a5c] dark:text-blue-400">
                  EUR {Number(pool.seatPrice).toLocaleString()}
                </p>
              </div>
              <span className="text-xs text-slate-400 italic">Enrolled students only</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
