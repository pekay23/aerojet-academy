import { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Calendar, MapPin, CreditCard, CheckCircle2, Clock } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { formatDate } from '@/lib/utils/date'

export const metadata: Metadata = { title: 'Pool Details | Applicant Portal' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function ExamBookingDetailPage({ params }: Props) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { id } = await params
  const userId = session.user.id

  const [pool, userMembership, userBooking] = await Promise.all([
    prismaUnfiltered.examPool.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            name: true,
            startDate: true,
            endDate: true,
            location: true,
          },
        },
      },
    }),
    prismaUnfiltered.poolMembership.findFirst({
      where: { poolId: id, userId },
    }),
    prismaUnfiltered.examBooking.findFirst({
      where: { userId, examPoolId: id },
    }),
  ])

  if (!pool) notFound()

  const isFull = pool.currentMemberCount >= pool.maxCandidates
  const isMember = !!userMembership
  const hasBooked = !!userBooking
  const statusColors: Record<string, string> = {
    OPEN: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    NEAR_FULL: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
    FULL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Link
        href="/applicant/exam-bookings"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-aerojet-blue dark:text-slate-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to bookings
      </Link>

      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-aerojet-blue dark:text-white">
              {pool.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {pool.event?.name || 'No associated event'}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
              statusColors[pool.status] || statusColors.DRAFT
            }`}
          >
            {pool.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Date</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {pool.examDate ? formatDate(pool.examDate) : 'TBD'}
            </p>
          </div>

          {pool.event?.location && (
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">Location</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {pool.event.location}
              </p>
            </div>
          )}

          <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Users className="h-4 w-4" />
              <span className="font-medium">Seats</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {pool.currentMemberCount} / {pool.maxCandidates}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <CreditCard className="h-4 w-4" />
              <span className="font-medium">Seat Price</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              €{Number(pool.seatPrice).toFixed(2)}
            </p>
          </div>
        </div>

        {pool.allowedModules && pool.allowedModules.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Allowed Modules</h3>
            <div className="flex flex-wrap gap-2">
              {pool.allowedModules.map((module: string) => (
                <span
                  key={module}
                  className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  {module}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          {isMember ? (
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              You are a member of this pool
            </div>
          ) : hasBooked ? (
            <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
              <Clock className="h-4 w-4" />
              Booking pending
            </div>
          ) : isFull ? (
            <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
              <Users className="h-4 w-4" />
              Pool is full
            </div>
          ) : (
            <Link
              href={`/applicant/exam-only/join-pool?poolId=${pool.id}`}
              className="inline-flex items-center justify-center rounded-xl bg-aerojet-blue px-6 py-3 text-sm font-bold text-white hover:bg-aerojet-blue/90 transition-colors"
            >
              Join Pool
            </Link>
          )}

          {!isMember && !hasBooked && isFull && (
            <Link
              href={`/applicant/exam-only/join-waitlist?poolId=${pool.id}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 px-6 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Join Waitlist
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
