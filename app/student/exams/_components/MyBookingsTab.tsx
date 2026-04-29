import { redirect } from 'next/navigation'
import { FileCheck, BookOpen, Calendar, MapPin } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import {
  deriveBookingFulfillmentState,
  hasMixedBookingGroupFulfillment,
} from '@/lib/exams/fulfillment'

export default async function MyBookingsTab() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const memberships = await prisma.poolMembership.findMany({
    where: { userId: session.user.id },
    include: {
      booking: {
        select: {
          id: true,
          demandStatus: true,
          examDate: true,
          bookingType: true,
          bookingGroupRef: true,
          executedAt: true,
          status: true,
          result: true,
          rolloverToEventId: true,
          rolloverFromBookingId: true,
        },
      },
      pool: { include: { event: true } },
      examComponent: { include: { course: { select: { code: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const rolloverTargetIds = Array.from(
    new Set(
      memberships
        .map((membership) => membership.booking?.rolloverToEventId)
        .filter((value): value is string => Boolean(value))
    )
  )

  const rolloverTargets = rolloverTargetIds.length
    ? await prisma.examEvent.findMany({
        where: { id: { in: rolloverTargetIds } },
        select: { id: true, name: true, startDate: true },
      })
    : []
  const rolloverTargetMap = new Map(
    rolloverTargets.map((event) => [event.id, event])
  )

  const bookingGroupRefs = Array.from(
    new Set(
      memberships
        .map((membership) => membership.booking?.bookingGroupRef)
        .filter((value): value is string => Boolean(value))
    )
  )

  const groupedBookings = bookingGroupRefs.length
    ? await prisma.examBooking.findMany({
        where: {
          userId: session.user.id,
          bookingGroupRef: { in: bookingGroupRefs },
          deletedAt: null,
        },
        select: {
          bookingGroupRef: true,
          demandStatus: true,
          executedAt: true,
          rolloverToEventId: true,
          result: true,
          status: true,
        },
      })
    : []

  const groupFulfillmentMap = new Map<string, boolean>()
  for (const groupRef of bookingGroupRefs) {
    const related = groupedBookings.filter((booking) => booking.bookingGroupRef === groupRef)
    groupFulfillmentMap.set(groupRef, hasMixedBookingGroupFulfillment(related))
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id }, select: { currency: true } })
  const { getCurrencySymbol } = await import('@/lib/currency')
  const currency = wallet?.currency || 'EUR'
  const currencySymbol = getCurrencySymbol(currency)
  const activeCount = memberships.filter((m) => ['RESERVED', 'CONFIRMED'].includes(m.status)).length
  const totalReserved = memberships.filter((m) => m.status === 'RESERVED').reduce((sum, m) => sum + Number(m.amountReserved || 0), 0)

  const displayMemberships = memberships.map((m) => {
    const rolloverTarget = m.booking?.rolloverToEventId
      ? rolloverTargetMap.get(m.booking.rolloverToEventId) || null
      : null

    const fulfillmentState = deriveBookingFulfillmentState({
      demandStatus: m.booking?.demandStatus,
      executedAt: m.booking?.executedAt,
      rolloverToEventId: m.booking?.rolloverToEventId,
      result: m.booking?.result,
      status: m.status,
    })
    let visualStatus: string = m.status
    if (fulfillmentState === 'EXECUTED') visualStatus = 'EXECUTED'
    else if (fulfillmentState === 'EXCUSED_PENDING_REBOOK') visualStatus = 'EXCUSED'
    else if (fulfillmentState === 'POSTPONED') visualStatus = 'POSTPONED'
    else if (fulfillmentState === 'PENDING_FULFILLMENT') visualStatus = 'POSTPONED'
    else if (fulfillmentState === 'ROLLED_FORWARD' || m.status === 'ROLLED') visualStatus = 'ROLLED'
    else if (fulfillmentState === 'SCHEDULED') visualStatus = 'SCHEDULED'

    return {
      ...m,
      visualStatus,
      effectiveDate: m.booking?.examDate || m.pool.examDate,
      rolloverTarget,
      partiallyFulfilledBundle: m.booking?.bookingGroupRef
        ? groupFulfillmentMap.get(m.booking.bookingGroupRef) || false
        : false,
      pendingFulfillment: fulfillmentState === 'PENDING_FULFILLMENT',
      isPast: new Date(m.booking?.examDate || m.pool.examDate) < new Date(),
    }
  })
  const pendingFulfillmentCount = displayMemberships.filter((m) => m.pendingFulfillment).length

  return (
    <div className="space-y-8">
      {displayMemberships.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Active Bookings</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Funds Reserved</p>
            <p className="mt-1 text-2xl font-black text-aerojet-blue dark:text-blue-400">{currencySymbol}{totalReserved.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Total Bookings</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{displayMemberships.length}</p>
          </div>
        </div>
      )}

      {pendingFulfillmentCount > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          {pendingFulfillmentCount} guaranteed booking{pendingFulfillmentCount === 1 ? '' : 's'} currently need a future event window for fulfillment.
        </div>
      )}

      {displayMemberships.length > 0 ? (
        <div className="space-y-4">
          {/* Mobile */}
            <div className="grid gap-4 md:hidden">
            {displayMemberships.map((m) => {
              const isAutoPool = m.pool.isAutoPool || m.pool.name.toLowerCase().includes('auto pool');
              const displayName = isAutoPool ? 'Auto Pool' : m.pool.name;
              
              return (
              <div key={`${m.userId}-${m.pool.id}`} className={`rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-900 ${m.visualStatus === 'CANCELLED' ? 'border-slate-200 opacity-60 dark:border-slate-700' : 'border-slate-100 dark:border-slate-800'}`}>
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{displayName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{m.pool.event?.name}</p>
                    {m.rolloverTarget && (
                      <p className="mt-1 text-xs text-violet-600 dark:text-violet-400">
                        Rolled into {m.rolloverTarget.name}
                      </p>
                    )}
                    {m.pendingFulfillment && (
                      <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                        Pending fulfillment in a future event window
                      </p>
                    )}
                    {m.partiallyFulfilledBundle && (
                      <p className="mt-1 text-xs text-cyan-700 dark:text-cyan-400">
                        Bundle partially fulfilled: completed modules stay executed while outstanding modules remain owed.
                      </p>
                    )}
                    {isAutoPool && (
                      <span className="mt-1 inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">Pending Assignment</span>
                    )}
                    {m.pool.poolType === 'STANDARD' && m.pool.poolLabel && !isAutoPool && (
                      <span className="mt-1 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Pool {m.pool.poolLabel}{m.pool.timeSlot ? ` · Day ${m.pool.dayNumber} ${m.pool.timeSlot === 'MORNING' ? 'AM' : 'PM'}` : ''}</span>
                    )}
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold tracking-wide uppercase ${m.visualStatus === 'CONFIRMED' || m.visualStatus === 'EXECUTED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : m.visualStatus === 'RESERVED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : m.visualStatus === 'SCHEDULED' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' : m.visualStatus === 'POSTPONED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : m.visualStatus === 'ROLLED' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' : m.visualStatus === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                    {m.visualStatus === 'RESERVED' ? 'Pending' : m.visualStatus === 'ROLLED' ? 'Rolled Forward' : m.visualStatus === 'EXECUTED' ? 'Executed' : m.visualStatus}
                  </span>
                </div>
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Module</p>
                    {m.examComponent?.course?.code ? (
                      <div className="flex items-center gap-1.5 pt-1"><BookOpen className="h-3.5 w-3.5 text-slate-400" /><span className="inline-flex rounded-lg bg-aerojet-blue/10 px-2.5 py-1 text-xs font-bold text-aerojet-blue dark:bg-blue-900/30 dark:text-blue-300">{m.examComponent.course.code}</span></div>
                    ) : (<span className="text-xs text-slate-400 italic">Not assigned</span>)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Reserved</p>
                    <div className="pt-1">
                      <p className={`font-bold ${m.visualStatus === 'CANCELLED' ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-slate-100'}`}>{currencySymbol}{Number(m.amountReserved || 0).toFixed(2)}</p>
                      {m.visualStatus === 'RESERVED' && <p className="text-xs text-slate-400">on hold</p>}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 border-t border-slate-50 pt-4 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><Calendar className="h-4 w-4 text-slate-400" /><span>{new Date(m.effectiveDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><MapPin className="h-4 w-4 text-slate-400" /><span>{m.pool.event?.location || 'Main Campus'}</span></div>
                </div>
              </div>
            )})}
          </div>

          {/* Desktop */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm md:block dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold tracking-widest text-slate-400 uppercase">Booking / Event</th>
                    <th className="px-6 py-4 text-xs font-bold tracking-widest text-slate-400 uppercase">Module</th>
                    <th className="px-6 py-4 text-xs font-bold tracking-widest text-slate-400 uppercase">Date &amp; Location</th>
                    <th className="px-6 py-4 text-xs font-bold tracking-widest text-slate-400 uppercase">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-bold tracking-widest text-slate-400 uppercase">Reserved</th>
                    <th className="px-6 py-4 text-xs font-bold tracking-widest text-slate-400 uppercase" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {displayMemberships.map((m) => {
                    const isAutoPool = m.pool.isAutoPool || m.pool.name.toLowerCase().includes('auto pool');
                    const displayName = isAutoPool ? 'Auto Pool' : m.pool.name;
                    
                    return (
                    <tr key={`${m.userId}-${m.pool.id}`} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${m.visualStatus === 'CANCELLED' ? 'opacity-60 grayscale' : ''}`}>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{displayName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{m.pool.event?.name}</p>
                        {m.rolloverTarget && (
                          <p className="mt-1 text-xs text-violet-600 dark:text-violet-400">
                            Rolled into {m.rolloverTarget.name}
                          </p>
                        )}
                        {m.pendingFulfillment && (
                          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                            Pending fulfillment in a future event window
                          </p>
                        )}
                        {m.partiallyFulfilledBundle && (
                          <p className="mt-1 text-xs text-cyan-700 dark:text-cyan-400">
                            Bundle partially fulfilled: completed modules stay executed while outstanding modules remain owed.
                          </p>
                        )}
                        {isAutoPool && (
                          <span className="mt-1 inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">Pending Assignment</span>
                        )}
                        {m.pool.poolType === 'STANDARD' && m.pool.poolLabel && !isAutoPool && (
                          <span className="mt-1 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Pool {m.pool.poolLabel}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {m.examComponent?.course?.code ? (
                          <div className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-slate-400" /><span className="inline-flex rounded-lg bg-aerojet-blue/10 px-2.5 py-1 text-xs font-bold text-aerojet-blue dark:bg-blue-900/30 dark:text-blue-300">{m.examComponent.course.code}</span></div>
                        ) : (<span className="text-xs text-slate-400 italic">Not assigned</span>)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-400" /><span>{new Date(m.effectiveDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
                          <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" /><span>{m.pool.event?.location || 'Main Campus'}</span></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold tracking-wide uppercase ${m.visualStatus === 'CONFIRMED' || m.visualStatus === 'EXECUTED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : m.visualStatus === 'RESERVED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : m.visualStatus === 'SCHEDULED' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' : m.visualStatus === 'POSTPONED' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : m.visualStatus === 'ROLLED' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' : m.visualStatus === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                          {m.visualStatus === 'RESERVED' ? 'Pending Confirmation' : m.visualStatus === 'ROLLED' ? 'Rolled Forward' : m.visualStatus === 'EXECUTED' ? 'Executed' : m.visualStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className={`font-bold ${m.visualStatus === 'CANCELLED' ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-slate-100'}`}>{currencySymbol}{Number(m.amountReserved || 0).toFixed(2)}</p>
                        {m.visualStatus === 'RESERVED' && <p className="text-xs text-slate-400">on hold</p>}
                        {m.visualStatus === 'CONFIRMED' && <p className="text-xs text-green-600">captured</p>}
                      </td>
                      <td className="px-6 py-4" />
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm dark:bg-slate-900"><FileCheck className="h-8 w-8" /></div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No bookings found</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">You haven&apos;t joined any exam bookings yet. Browse the Available Bookings tab to find one.</p>
        </div>
      )}
    </div>
  )
}
