import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FileCheck, Calendar, MapPin, ArrowLeft } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

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
    },
    orderBy: { createdAt: 'desc' },
  })

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
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          My Bookings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track your exam pool memberships and status.</p>
      </div>

      {memberships.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Pool / Event
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Date & Location
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Seat Price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {memberships.map((m) => (
                  <tr key={`${m.userId}-${m.poolId}`} className="hover:bg-slate-50 dark:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{m.pool.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{m.pool.event?.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{new Date(m.pool.examDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>{m.pool.event?.location || 'Main Campus'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                          m.status === 'CONFIRMED'
                            ? 'bg-green-100 text-green-700'
                            : m.status === 'RESERVED'
                              ? 'bg-blue-100 text-blue-700'
                              : m.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-bold text-slate-900 dark:text-slate-100">
                        {Number(m.pool.seatPrice).toFixed(2)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-slate-900 text-slate-300 shadow-sm">
            <FileCheck className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No bookings found</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            You haven't joined any exam pools yet.
          </p>
          <div className="mt-8">
            <Link
              href="/student/exam-pools"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-95"
            >
              Browse Pools
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

