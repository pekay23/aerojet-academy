import { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import {
  ChevronLeft,
  CalendarDays,
  CreditCard,
  Users,
  FileBarChart2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  BookOpen,
  Tag,
} from 'lucide-react'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import ChangeModuleModal from '../_components/ChangeModuleModal'

export const metadata: Metadata = {
  title: 'Booking Details | Student Portal',
  description: 'View details and status of your exam booking.',
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  APPROVED: {
    label: 'Approved',
    color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    icon: CheckCircle2,
  },
  PENDING: {
    label: 'Pending',
    color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    icon: Clock,
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
    icon: XCircle,
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    icon: FileBarChart2,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    icon: XCircle,
  },
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params
  const session = await getAuthSession()
  if (!session || session.user.role !== 'STUDENT') redirect('/login')

  const booking = await prisma.examBooking.findUnique({
    where: { id: bookingId },
    include: {
      exam: { select: { passingScore: true } },
      examComponent: { include: { course: true } },
      event: true,
      walletTransaction: true,
      user: { include: { profile: true } },
      poolMemberships: {
        include: {
          pool: true,
          examComponent: { include: { course: true } },
        },
      },
      course: true,
    },
  })

  if (!booking) notFound()
  if (booking.userId !== session.user.id) redirect('/student/exams')

  const bundle = await prisma.examBundle.findFirst({
    where: { userId: session.user.id, status: 'ACTIVE' }
  })
  const hasFreeChanges = bundle ? bundle.freeModuleChanges > bundle.usedModuleChanges : false

  const status = statusConfig[booking.status] || statusConfig.PENDING
  const StatusIcon = status.icon
  const moduleCode =
    booking.moduleCode ||
    booking.examComponent?.course?.code ||
    booking.course?.code ||
    'N/A'
  const moduleName =
    booking.examComponent?.course?.name ||
    booking.course?.name ||
    ''


  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/student/exams?tab=records"
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-slate-400 uppercase transition-colors hover:text-aerojet-sky"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to My Exams
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-aerojet-blue sm:text-3xl dark:text-white">
              Booking: {moduleCode}
            </h1>
            {moduleName && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{moduleName}</p>
            )}
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-black tracking-widest uppercase ${status.color}`}
          >
            <StatusIcon className="h-4 w-4" />
            {status.label}
          </div>
        </div>
      </div>

      {/* Booking Info */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <h2 className="mb-6 text-xs font-black tracking-widest text-slate-400 uppercase">
          Booking Information
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 dark:bg-slate-800">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                Booking Type
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                {booking.bookingType === 'POOL' ? 'Pool Booking' : 'Individual Booking'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 dark:bg-slate-800">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                Exam Date
              </p>
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                {booking.examDate
                  ? new Date(booking.examDate).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })
                  : 'Not scheduled'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 dark:bg-slate-800">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Module</p>
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                {moduleCode}
              </p>
              {moduleName && (
                <p className="text-xs text-slate-400">{moduleName}</p>
              )}
              {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                <ChangeModuleModal 
                  bookingId={booking.id} 
                  currentModuleCode={moduleCode} 
                  hasFreeChanges={hasFreeChanges} 
                />
              )}
            </div>
          </div>

          {booking.event && (
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 dark:bg-slate-800">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Event</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                  {booking.event.name}
                </p>
                {booking.event.startDate && (
                  <p className="text-xs text-slate-400">
                    {new Date(booking.event.startDate).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {booking.event.endDate &&
                      ` — ${new Date(booking.event.endDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}`}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Section */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <h2 className="mb-6 flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase">
          <CreditCard className="h-3.5 w-3.5" />
          Payment Details
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
              Amount Paid
            </p>
            <p className="mt-1 text-xl font-black tabular-nums text-slate-900 dark:text-slate-100">
              &euro;{Number(booking.amountPaid).toFixed(2)}
            </p>
          </div>
          {booking.walletTransaction && (
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                Transaction Reference
              </p>
              <p className="mt-1 text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                {booking.walletTransaction.id.slice(-12).toUpperCase()}
              </p>
            </div>
          )}
          {!booking.walletTransaction && (
            <div>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                Transaction Reference
              </p>
              <p className="mt-1 text-sm font-medium text-slate-400 italic">Not available</p>
            </div>
          )}
        </div>
      </div>

      {/* Pool Information */}
      {booking.poolMemberships && booking.poolMemberships.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <h2 className="mb-6 flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase">
            <Users className="h-3.5 w-3.5" />
            Pool Information
          </h2>
          <div className="space-y-4">
            {booking.poolMemberships.map((membership) => (
              <div
                key={membership.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {membership.pool.name}
                    </p>
                    {membership.pool.timeSlot && (
                      <p className="mt-1 text-xs text-slate-400">
                        Time Slot: {membership.pool.timeSlot}
                      </p>
                    )}
                    {membership.examComponent?.course && (
                      <p className="mt-0.5 text-xs text-slate-400">
                        {membership.examComponent.course.code} &mdash;{' '}
                        {membership.examComponent.course.name}
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase ${
                      membership.status === 'CONFIRMED'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {membership.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Booked At footer */}
      <div className="text-center text-xs font-medium text-slate-400">
        Booked on{' '}
        {new Date(booking.bookedAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })}
        {booking.isResit && (
          <span className="ml-2 inline-flex rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold tracking-widest text-amber-600 uppercase dark:bg-amber-500/10 dark:text-amber-400">
            Resit
          </span>
        )}
      </div>
    </div>
  )
}
