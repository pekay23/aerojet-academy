import { redirect } from 'next/navigation'
import { Wallet, Info } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { getExamPricingConfig } from '@/lib/pools/pricing-config'
import ResitBooking from './ResitBooking'

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

  // Compute eligible components for resit: user must have failed these previously
  const failedResults = await prisma.examResult.findMany({
    where: { userId, passed: false },
    include: { exam: { include: { examComponent: true } } },
  })
  
  // Also check migrated historical failures
  const historicalBookings = await prisma.examBooking.findMany({
    where: { userId },
    select: { examComponentId: true, result: true, attemptType: true },
  })
  
  const eligibleIds = new Set<string>()
  failedResults.forEach((r) => { if (r.exam.examComponentId) eligibleIds.add(r.exam.examComponentId) })
  historicalBookings.forEach((b) => {
    if (b.result?.toLowerCase() === 'fail' && b.examComponentId) {
      eligibleIds.add(b.examComponentId)
    }
  })

  // Determine which components the user has "active" memberships for
  const activeMemberships = await prisma.poolMembership.findMany({
    where: { userId, status: { in: ['RESERVED', 'CONFIRMED'] } },
    select: { examComponentId: true }
  })
  const activeComponentIds = new Set(activeMemberships.map(m => m.examComponentId).filter(Boolean))

  const eligibleModules = ecMapped.filter(
    (ec) => eligibleIds.has(ec.id) && !activeComponentIds.has(ec.id)
  )

  return { wallet, pricing, openEvents, eligibleModules, balance, currency, currencySymbol }
}

export default async function ResitBookingTab() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { wallet, pricing, balance, currency, currencySymbol, openEvents } = await getBookingData(session.user.id)

  const [failedResults, historicalBookings] = await Promise.all([
    prisma.examResult.findMany({
      where: { userId: session.user.id, passed: false },
      include: {
        exam: {
          include: {
            examComponent: { include: { course: true } },
            event: true,
          },
        },
      },
    }),
    prisma.examBooking.findMany({
      where: { userId: session.user.id, result: { not: null } },
      include: {
        exam: {
          include: {
            examComponent: { include: { course: true } },
            event: true,
          },
        },
      },
    }),
  ])

  // Aggregate free resits from bundles
  const bookingsWithCredits = await prisma.examBooking.findMany({
    where: {
      userId: session.user.id,
      bookingType: { in: ['TWIN_PACK', 'FOUR_PACK'] },
    },
    select: { bookingGroupRef: true, bookingType: true },
    distinct: ['bookingGroupRef'],
  })

  // Group active memberships to find remaining resit credits via the booking relation
  const memberships = await prisma.poolMembership.findMany({
    where: { userId: session.user.id },
    select: { booking: { select: { bookingGroupRef: true } } },
  })
  const memberCounts = memberships.reduce(
    (acc, m) => {
      const ref = m.booking?.bookingGroupRef
      if (ref) acc[ref] = (acc[ref] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const freeResits = bookingsWithCredits
    .map((b) => {
      const totalAllowed = b.bookingType === 'TWIN_PACK' ? 3 : 6 // max seats config + 1 or 2 free resits
      const used = memberCounts[b.bookingGroupRef as string] || 0
      const remaining = Math.max(0, totalAllowed - used)
      return {
        bookingGroupRef: b.bookingGroupRef as string,
        bookingType: b.bookingType,
        remaining,
        notes: null,
      }
    })
    .filter((r) => r.remaining > 0 && r.bookingGroupRef)

  // Deduplicate and map failed exams by Module Code to handle legacy migrated data
  const failedMap = new Map<string, any>()

  failedResults.forEach((r) => {
    const code = r.exam.examComponent?.course?.code || '—'
    if (code !== '—') {
      failedMap.set(code, {
        examId: r.exam.id,
        examName: r.exam.name,
        moduleCode: code,
        moduleName: r.exam.examComponent?.course?.name || '—',
        score: Number(r.score),
        passingScore: Number(r.exam.passingScore || 75),
        examDate: r.exam.examDate.toISOString(),
        eventName: r.exam.event?.name || null,
        // Keep component ID for booking logic if needed
        examComponentId: r.exam.examComponentId,
      })
    }
  })

  historicalBookings.forEach((b) => {
    const code = b.moduleCode || b.exam?.examComponent?.course?.code || '—'
    if (b.result?.toLowerCase() === 'fail' && code !== '—' && !failedMap.has(code)) {
      failedMap.set(code, {
        examId: b.examId || b.id, // Fallback to booking ID if migrated without exam
        examName: b.exam?.name || 'Historical Exam',
        moduleCode: code,
        moduleName: b.exam?.examComponent?.course?.name || '—',
        score: b.score ? Number(b.score) : 0,
        passingScore: 75,
        examDate: (b.examDate || b.bookedAt).toISOString(),
        eventName: b.exam?.event?.name || null,
        examComponentId: b.examComponentId,
      })
    }
  })

  // Exclude active module memberships
  const activeMemberships = await prisma.poolMembership.findMany({
    where: { userId: session.user.id, status: { in: ['RESERVED', 'CONFIRMED'] } },
    select: { examComponent: { select: { course: { select: { code: true } } } } },
  })
  activeMemberships.forEach((m) => {
    const code = m.examComponent?.course?.code
    if (code) failedMap.delete(code)
  })

  const failedExams = Array.from(failedMap.values())

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-l-4 border-slate-100 border-l-rose-500 bg-rose-50/30 p-5 dark:border-slate-800 dark:bg-rose-900/10">
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Exam Resit</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Book a resit for an exam you did not pass.</p>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <Wallet className="h-4 w-4 text-slate-400" />
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Available: {currencySymbol}{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Resit Seat</h3>
          <span className="text-lg font-black text-rose-600">
            {currencySymbol}
            {pricing.resitExamFee}
          </span>
        </div>
        <p className="mb-6 text-sm text-slate-500">
          Select a failed module and an upcoming exam window. Resit attempts are automatically queued for pool assignment.
        </p>

        <ResitBooking
          failedExams={failedExams}
          freeResits={freeResits}
          resitPrice={pricing.resitExamFee}
          currency={currency}
          availableBalance={balance}
          events={openEvents}
        />
      </div>
    </div>
  )
}
