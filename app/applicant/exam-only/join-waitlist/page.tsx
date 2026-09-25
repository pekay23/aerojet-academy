import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Calendar, MapPin, CreditCard } from 'lucide-react'
import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { formatDate } from '@/lib/utils/date'
import JoinWaitlistForm from './_components/JoinWaitlistForm'

export const metadata: Metadata = { title: 'Join Waitlist | Applicant Portal' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ poolId?: string }>
}

export default async function JoinWaitlistPage({ searchParams }: PageProps) {
  const session = await getAuthSession()
  if (!session) return await redirectToLogin()

  const { poolId } = await searchParams
  if (!poolId) redirect('/applicant/exam-bookings')

  const pool = await prismaUnfiltered.examPool.findUnique({
    where: { id: poolId },
    include: {
      event: {
        select: { name: true, startDate: true, endDate: true, location: true },
      },
    },
  })

  if (!pool) redirect('/applicant/exam-bookings')

  const isFull = pool.currentMemberCount >= pool.maxCandidates

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-3xl space-y-6 duration-700">
      <Link
        href="/applicant/exam-bookings"
        className="hover:text-aerojet-blue inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to bookings
      </Link>

      <div className="space-y-6 rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-aerojet-blue text-2xl font-black tracking-tight dark:text-white">
            Join Waitlist
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            This booking is currently full. Join the waitlist and we will auto-promote you if a seat
            opens.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Date</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {pool.examDate ? formatDate(pool.examDate) : 'TBD'}
            </p>
          </div>

          {pool.event?.location && (
            <div className="space-y-2 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">Location</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {pool.event.location}
              </p>
            </div>
          )}

          <div className="space-y-2 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Users className="h-4 w-4" />
              <span className="font-medium">Seats</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {pool.currentMemberCount} / {pool.maxCandidates}
            </p>
          </div>

          <div className="space-y-2 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <CreditCard className="h-4 w-4" />
              <span className="font-medium">Seat Price</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              €{Number(pool.seatPrice).toFixed(2)}
            </p>
          </div>
        </div>

        {!isFull && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-400">
            This booking still has available seats. You can join directly instead.
          </div>
        )}

        <JoinWaitlistForm poolId={pool.id} poolName={pool.name} disabled={!isFull} />
      </div>
    </div>
  )
}
