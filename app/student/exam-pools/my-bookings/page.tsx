import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FileCheck, Calendar, MapPin, ArrowLeft, BookOpen } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import LeavePoolButton from './_components/LeavePoolButton'

export const metadata: Metadata = { title: 'My Bookings | Student Portal' }

export default async function MyBookingsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const memberships = await prisma.poolMembership.findMany({
    where: { userId: session.user.id },
    include: {
      pool: {
        include: { event: true },
      },
      examComponent: {
        include: { course: { select: { code: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const wallet = await prisma.wallet.findUnique({
    where: { userId: session.user.id },
    select: { currency: true },
  })
  const { getCurrencySymbol } = await import('@/lib/currency')
  const currency = wallet?.currency || 'EUR'
  const currencySymbol = getCurrencySymbol(currency)

  const activeCount = memberships.filter((m) => ['RESERVED', 'CONFIRMED'].includes(m.status)).length
  const totalReserved = memberships
    .filter((m) => m.status === 'RESERVED')
    .reduce((sum, m) => sum + Number(m.amountReserved || 0), 0)

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/student/exam-pools"
          className="mb-2 inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Exam Pools
        </Link>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
          My Bookings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Track your exam pool memberships and status.
        </p>
      </div>

      {/* Summary stats */}
      {memberships.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Active Bookings
            </p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">
              {activeCount}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Funds Reserved
            </p>
            <p className="mt-1 text-2xl font-black text-[#002a5c] dark:text-blue-400">
              {currencySymbol}
              {totalReserved.toFixed(2)}
            </p>
          </div>
          <div className="col-span-2 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:col-span-1 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Total Bookings
            </p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">
              {memberships.length}
            </p>
          </div>
        </div>
      )}

      {memberships.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    Pool / Event
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    Module
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    Date &amp; Location
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                    Reserved
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {memberships.map((m) => {
                  const canLeave = m.status === 'RESERVED' && m.pool.status !== 'CONFIRMED'

                  return (
                    <tr
                      key={`${m.userId}-${m.poolId}`}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {m.pool.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {m.pool.event?.name}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {m.examComponent?.course?.code ? (
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                            <span className="inline-flex rounded-lg bg-[#002a5c]/10 px-2.5 py-1 text-xs font-bold text-[#002a5c] dark:bg-blue-900/30 dark:text-blue-300">
                              {m.examComponent.course.code}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>
                              {new Date(m.pool.examDate).toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <span>{m.pool.event?.location || 'Main Campus'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ${
                            m.status === 'CONFIRMED'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : m.status === 'RESERVED'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : m.status === 'CANCELLED'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {m.status === 'RESERVED' ? 'Pending Confirmation' : m.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {currencySymbol}
                          {Number(m.amountReserved || 0).toFixed(2)}
                        </p>
                        {m.status === 'RESERVED' && (
                          <p className="text-[10px] text-slate-400">on hold</p>
                        )}
                        {m.status === 'CONFIRMED' && (
                          <p className="text-[10px] text-green-600">captured</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {canLeave && (
                          <LeavePoolButton
                            poolId={m.poolId}
                            poolName={m.pool.name}
                            amount={Number(m.amountReserved || 0)}
                            currency={currency}
                          />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm dark:bg-slate-900">
            <FileCheck className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            No bookings found
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            You haven&apos;t joined any exam pools yet.
          </p>
          <div className="mt-8">
            <Link
              href="/student/exam-pools"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#002a5c] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-[#003a7c] active:scale-95"
            >
              Browse Pools
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
