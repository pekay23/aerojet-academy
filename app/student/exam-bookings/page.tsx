import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FileCheck, Users, Calendar, MapPin, Wallet, Info, BookOpen } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import JoinPoolButton from './_components/JoinPoolButton'
import StandaloneBooking from './_components/StandaloneBooking'
import LeavePoolButton from './my-bookings/_components/LeavePoolButton'
import PoolsTabs from './_components/PoolsTabs'
import CreatePoolModal from './_components/CreatePoolModal'
import GroupBookingModal from './_components/GroupBookingModal'
import BundleBooking from './_components/BundleBooking'
import QuickBookingActions from './_components/QuickBookingActions'
import ResitBooking from './_components/ResitBooking'
import { getSystemSetting } from '@/lib/settings'
import { getExamPricingConfig } from '@/lib/pools/pricing-config'

export const metadata: Metadata = {
  title: 'Exam Bookings | Student Portal',
  description: 'Browse and join exam bookings.',
}

interface ExamWithCourse {
  id: string
  name: string
  examDate: Date
  examComponent: {
    course: { code: string; name: string }
  }
}

/* ── Helper: fetch common booking data ── */
async function getBookingData(userId: string) {
  const [wallet, pricing, openEvents, upcomingExams, examComponents] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId } }),
    getExamPricingConfig(),
    prisma.examEvent.findMany({
      where: {
        status: { in: ['OPEN', 'DRAFT'] },
        joinDeadline: { gt: new Date() },
      },
      select: { id: true, name: true, startDate: true, endDate: true },
      orderBy: { startDate: 'asc' },
    }),
    prisma.exam.findMany({
      where: { examDate: { gt: new Date() } },
      select: {
        id: true,
        name: true,
        examDate: true,
        examComponent: { select: { course: { select: { code: true, name: true } } } },
      },
      orderBy: { examDate: 'asc' },
    }),
    prisma.examComponent.findMany({
      select: { id: true, course: { select: { code: true, name: true } } },
      orderBy: { course: { code: 'asc' } },
    }),
  ])
  const { getCurrencySymbol } = await import('@/lib/currency')
  const balance = Number(wallet?.availableBalance || 0)
  const currency = wallet?.currency || 'EUR'
  const currencySymbol = getCurrencySymbol(currency)
  const ecMapped = examComponents.map((ec) => ({ id: ec.id, code: ec.course.code, name: ec.course.name }))

  return { wallet, pricing, openEvents, upcomingExams, examComponents: ecMapped, balance, currency, currencySymbol }
}

/* ── Available Bookings Tab ── */
async function AvailablePoolsContent() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const [pools, studentProfile, bookingData, myMemberships] = await Promise.all([
    prisma.examPool.findMany({
      where: {
        status: { in: ['OPEN', 'NEAR_FULL', 'CONFIRMED', 'DRAFT'] },
        poolType: 'STANDARD', // Only show standard pools — AUTO and GROUP_CHARTER are system-managed
        event: { status: { in: ['OPEN', 'CONFIRMED', 'DRAFT'] } },
      },
      include: {
        event: true,
        memberships: {
          where: { status: { in: ['RESERVED', 'CONFIRMED'] } },
          select: {
            examComponentId: true,
            examComponent: { select: { course: { select: { code: true } } } },
          },
        },
      },
      orderBy: { examDate: 'asc' },
    }),
    prisma.studentProfile.findUnique({ where: { userId: session.user.id } }),
    getBookingData(session.user.id),
    prisma.poolMembership.findMany({
      where: { userId: session.user.id, status: { in: ['RESERVED', 'CONFIRMED'] } },
      select: { poolId: true, examComponentId: true },
    }),
  ])

  const { wallet, balance, currency, currencySymbol } = bookingData
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
        <span><strong>Join a pool</strong> at the cheapest rate (€300/seat) or <strong>book individually</strong> (€520) — individual, twin pack, 4-pack, and resit bookings are auto-assigned to a pool by the booking deadline. Each pool accepts <strong>25–28 candidates</strong>. No refund until admin refunds (wallet credit only).</span>
      </div>

      {/* Pool Cards */}
      {pools.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pools.map((pool) => {
            const isJoined = joinedPoolIds.has(pool.id)
            const seatPrice = Number(pool.seatPrice)
            const canAfford = balance >= seatPrice
            const isFull = pool.currentMemberCount >= pool.maxCandidates
            const existingModules = [...new Set(pool.memberships.map((m) => m.examComponent?.course?.code).filter((m): m is string => !!m))]

            return (
              <div key={pool.id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                <div className={`flex items-center justify-between px-6 py-2 text-xs font-black tracking-widest text-white uppercase ${pool.status === 'NEAR_FULL' ? 'bg-amber-500' : pool.status === 'DRAFT' ? 'bg-slate-500' : pool.status === 'CONFIRMED' ? 'bg-blue-600' : 'bg-aerojet-blue'}`}>
                  <span>{pool.status === 'DRAFT' ? 'Upcoming' : pool.status.replace('_', ' ')}</span>
                  {pool.timeSlot && <span className="text-white/80">{pool.poolLabel ? `Pool ${pool.poolLabel}` : ''} · Day {pool.dayNumber} {pool.timeSlot === 'MORNING' ? 'AM' : 'PM'}</span>}
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
                        {existingModules.map((m) => (<span key={m} className="bg-aerojet-blue/10 text-aerojet-blue inline-flex rounded-md px-2 py-0.5 text-xs font-bold dark:bg-blue-900/30 dark:text-blue-300">{m}</span>))}
                      </div>
                    </div>
                  )}
                  <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-4 dark:border-slate-800">
                    <div>
                      <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Seat Price</p>
                      <p className="text-aerojet-blue text-lg font-black dark:text-blue-400">{currencySymbol}{seatPrice.toFixed(2)}</p>
                    </div>
                    {isJoined ? (
                      <button disabled className="rounded-xl bg-emerald-100 px-4 py-2 text-xs font-bold tracking-wide text-emerald-700 uppercase dark:bg-emerald-900/30 dark:text-emerald-400">Joined ✓</button>
                    ) : (
                      <JoinPoolButton poolId={pool.id} poolName={pool.name} price={seatPrice} currency={currency} canAfford={canAfford} availableBalance={balance} currentModules={existingModules} isFull={isFull} />
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

/* ── My Bookings Tab ── */
async function MyBookingsContent() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const memberships = await prisma.poolMembership.findMany({
    where: { userId: session.user.id },
    include: {
      pool: { include: { event: true } },
      examComponent: { include: { course: { select: { code: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id }, select: { currency: true } })
  const { getCurrencySymbol } = await import('@/lib/currency')
  const currency = wallet?.currency || 'EUR'
  const currencySymbol = getCurrencySymbol(currency)
  const activeCount = memberships.filter((m) => ['RESERVED', 'CONFIRMED'].includes(m.status)).length
  const totalReserved = memberships.filter((m) => m.status === 'RESERVED').reduce((sum, m) => sum + Number(m.amountReserved || 0), 0)

  return (
    <div className="space-y-8">
      {memberships.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Active Bookings</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Funds Reserved</p>
            <p className="mt-1 text-2xl font-black text-[#002a5c] dark:text-blue-400">{currencySymbol}{totalReserved.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Total Bookings</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{memberships.length}</p>
          </div>
        </div>
      )}

      {memberships.length > 0 ? (
        <div className="space-y-4">
          {/* Mobile */}
          <div className="grid gap-4 md:hidden">
            {memberships.map((m) => (
              <div key={`${m.userId}-${m.pool.id}`} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{m.pool.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{m.pool.event?.name}</p>
                    {m.pool.isAutoPool && (
                      <span className="mt-1 inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">Pending Assignment</span>
                    )}
                    {m.pool.poolType === 'STANDARD' && m.pool.poolLabel && (
                      <span className="mt-1 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Pool {m.pool.poolLabel}{m.pool.timeSlot ? ` · Day ${m.pool.dayNumber} ${m.pool.timeSlot === 'MORNING' ? 'AM' : 'PM'}` : ''}</span>
                    )}
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold tracking-wide uppercase ${m.status === 'CONFIRMED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : m.status === 'RESERVED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : m.status === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                    {m.status === 'RESERVED' ? 'Pending' : m.status}
                  </span>
                </div>
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Module</p>
                    {m.examComponent?.course?.code ? (
                      <div className="flex items-center gap-1.5 pt-1"><BookOpen className="h-3.5 w-3.5 text-slate-400" /><span className="inline-flex rounded-lg bg-[#002a5c]/10 px-2.5 py-1 text-xs font-bold text-[#002a5c] dark:bg-blue-900/30 dark:text-blue-300">{m.examComponent.course.code}</span></div>
                    ) : (<span className="text-xs text-slate-400 italic">Not assigned</span>)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Reserved</p>
                    <div className="pt-1">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{currencySymbol}{Number(m.amountReserved || 0).toFixed(2)}</p>
                      {m.status === 'RESERVED' && <p className="text-xs text-slate-400">on hold</p>}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 border-t border-slate-50 pt-4 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><Calendar className="h-4 w-4 text-slate-400" /><span>{new Date(m.pool.examDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><MapPin className="h-4 w-4 text-slate-400" /><span>{m.pool.event?.location || 'Main Campus'}</span></div>
                </div>
              </div>
            ))}
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
                  {memberships.map((m) => (
                    <tr key={`${m.userId}-${m.pool.id}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{m.pool.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{m.pool.event?.name}</p>
                        {m.pool.isAutoPool && (
                          <span className="mt-1 inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">Pending Assignment</span>
                        )}
                        {m.pool.poolType === 'STANDARD' && m.pool.poolLabel && !m.pool.isAutoPool && (
                          <span className="mt-1 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Pool {m.pool.poolLabel}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {m.examComponent?.course?.code ? (
                          <div className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-slate-400" /><span className="inline-flex rounded-lg bg-[#002a5c]/10 px-2.5 py-1 text-xs font-bold text-[#002a5c] dark:bg-blue-900/30 dark:text-blue-300">{m.examComponent.course.code}</span></div>
                        ) : (<span className="text-xs text-slate-400 italic">Not assigned</span>)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-400" /><span>{new Date(m.pool.examDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
                          <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" /><span>{m.pool.event?.location || 'Main Campus'}</span></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold tracking-wide uppercase ${m.status === 'CONFIRMED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : m.status === 'RESERVED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : m.status === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                          {m.status === 'RESERVED' ? 'Pending Confirmation' : m.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{currencySymbol}{Number(m.amountReserved || 0).toFixed(2)}</p>
                        {m.status === 'RESERVED' && <p className="text-xs text-slate-400">on hold</p>}
                        {m.status === 'CONFIRMED' && <p className="text-xs text-green-600">captured</p>}
                      </td>
                      <td className="px-6 py-4" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm dark:bg-slate-900"><FileCheck className="h-8 w-8" /></div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No bookings found</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">You haven&apos;t joined any exam bookings yet. Switch to the Available Bookings tab to browse.</p>
        </div>
      )}
    </div>
  )
}

/* ── Booking Action Content ── */
async function BookingActionContent({ type }: { type: 'group' | 'individual' | 'twin' | 'four-pack' }) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { wallet, pricing, openEvents, upcomingExams, examComponents, balance, currency, currencySymbol } =
    await getBookingData(session.user.id)

  const BOOKING_META: Record<string, { title: string; description: string; color: string }> = {
    group: {
      title: 'Start a Group Booking',
      description: 'Create a custom group charter for your organization or study group. A group booking allows you to reserve a full exam session.',
      color: 'blue',
    },
    individual: {
      title: 'Book an Individual Seat',
      description: 'Reserve a single exam seat (€520). Your seat will be auto-assigned to an available pool by the booking deadline.',
      color: 'emerald',
    },
    twin: {
      title: 'Book a Twin Pack',
      description: 'Bundle 2 exam seats at a discounted rate (€980). Seats are auto-assigned to pools by the booking deadline.',
      color: 'indigo',
    },
    'four-pack': {
      title: 'Book a 4-Pack',
      description: 'Best value — 4 exam seats at €1,900. Seats are auto-assigned to pools by the booking deadline.',
      color: 'amber',
    },
  }

  const meta = BOOKING_META[type]
  const colorClasses: Record<string, string> = {
    blue: 'border-l-blue-500 bg-blue-50/30 dark:bg-blue-900/10',
    emerald: 'border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10',
    indigo: 'border-l-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10',
    amber: 'border-l-amber-500 bg-amber-50/30 dark:bg-amber-900/10',
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
      <div className={`rounded-xl border border-l-4 border-slate-100 p-5 ${colorClasses[meta.color]} dark:border-slate-800`}>
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">{meta.title}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{meta.description}</p>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <Wallet className="h-4 w-4 text-slate-400" />
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Available: {currencySymbol}{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Booking Form */}
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        {type === 'group' && (
          <GroupBookingModal
            events={openEvents}
            groupCharterFee={pricing.groupCharterFee}
            currency={currency}
            availableBalance={balance}
            trigger={<button className={`w-full rounded-xl py-3 text-sm font-bold text-white transition-all active:scale-[0.98] ${btnColors[meta.color]}`}>Configure Group Booking</button>}
          />
        )}
        {type === 'individual' && (
          <StandaloneBooking
            price={pricing.individualExamFee}
            currency={currency}
            availableBalance={balance}
            upcomingExams={upcomingExams}
            examComponents={examComponents}
            events={openEvents}
            trigger={<button className={`w-full rounded-xl py-3 text-sm font-bold text-white transition-all active:scale-[0.98] ${btnColors[meta.color]}`}>Select Exam &amp; Book Seat</button>}
          />
        )}
        {type === 'twin' && (
          <BundleBooking
            bundleSize={2}
            bundlePrice={pricing.twoSeatBundle}
            individualPrice={pricing.individualExamFee}
            currency={currency}
            availableBalance={balance}
            events={openEvents}
            trigger={<button className={`w-full rounded-xl py-3 text-sm font-bold text-white transition-all active:scale-[0.98] ${btnColors[meta.color]}`}>Purchase Twin Pack</button>}
          />
        )}
        {type === 'four-pack' && (
          <BundleBooking
            bundleSize={4}
            bundlePrice={pricing.fourSeatBundle}
            individualPrice={pricing.individualExamFee}
            currency={currency}
            availableBalance={balance}
            events={openEvents}
            trigger={<button className={`w-full rounded-xl py-3 text-sm font-bold text-white transition-all active:scale-[0.98] ${btnColors[meta.color]}`}>Purchase 4-Pack</button>}
          />
        )}
      </div>
    </div>
  )
}

/* ── Resit Booking Content ── */
async function ResitBookingContent() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { wallet, pricing, balance, currency, currencySymbol } = await getBookingData(session.user.id)

  // Get student profile to verify enrollment type
  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { enrollmentType: true },
  })

  // Fetch failed exam results
  const failedResults = await prisma.examResult.findMany({
    where: {
      userId: session.user.id,
      passed: false,
    },
    include: {
      exam: {
        include: {
          examComponent: {
            include: { course: true },
          },
          event: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Fetch free resit entitlements from bundle bookings
  const entitlements = await prisma.bookingEntitlement.findMany({
    where: {
      userId: session.user.id,
      includedFreeResits: { gt: 0 },
    },
  })

  const failedExams = failedResults.map((r) => ({
    examId: r.examId,
    examName: r.exam.name,
    moduleCode: r.exam.examComponent.course.code,
    moduleName: r.exam.examComponent.course.name,
    score: Number(r.percentage),
    passingScore: Number(r.exam.passingScore),
    examDate: r.exam.examDate.toISOString(),
    eventName: r.exam.event?.name || null,
  }))

  const freeResits = entitlements
    .filter((e) => e.includedFreeResits > e.usedFreeResits)
    .map((e) => ({
      bookingGroupRef: e.bookingGroupRef,
      bookingType: e.bookingType,
      remaining: e.includedFreeResits - e.usedFreeResits,
      notes: e.notes,
    }))

  const isEligible = studentProfile?.enrollmentType === 'EXAM_ONLY' || studentProfile?.enrollmentType === 'MODULAR'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-l-4 border-l-red-500 border-slate-100 bg-red-50/30 p-5 dark:border-slate-800 dark:bg-red-900/10">
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Book an Exam Resit</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Retake a previously failed exam. Resit fee is {currencySymbol}{pricing.resitExamFee.toFixed(2)} per exam, 
          subject to seat availability. Bundle holders may have free resit credits.
        </p>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <Wallet className="h-4 w-4 text-slate-400" />
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Available: {currencySymbol}{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {!isEligible ? (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-900/50 dark:bg-amber-900/10">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Resit bookings are available for <strong>Exam-Only</strong> and <strong>Modular</strong> pathway students.
            Full-time students should contact administration for resit arrangements.
          </p>
        </div>
      ) : (
        <ResitBooking
          failedExams={failedExams}
          freeResits={freeResits}
          resitPrice={pricing.resitExamFee}
          currency={currency}
          availableBalance={balance}
        />
      )}
    </div>
  )
}

/* ── Main Page ── */
export default async function ExamPoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { tab = 'available' } = await searchParams
  const bookingTypes = ['group', 'individual', 'twin', 'four-pack'] as const

  return (
    <PoolsTabs>
      {tab === 'my-bookings' ? (
        <MyBookingsContent />
      ) : tab === 'resit' ? (
        <ResitBookingContent />
      ) : bookingTypes.includes(tab as any) ? (
        <BookingActionContent type={tab as 'group' | 'individual' | 'twin' | 'four-pack'} />
      ) : (
        <AvailablePoolsContent />
      )}
    </PoolsTabs>
  )
}
