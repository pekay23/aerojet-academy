import { redirect } from 'next/navigation'
import { Wallet } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { getExamPricingConfig } from '@/lib/pools/pricing-config'
import ResitBooking from './ResitBooking'
import { ACADEMIC_RULES } from '@/lib/constants/business-rules'
import { ACTIVE_MEMBERSHIP_STATUSES } from '@/lib/utils/constants'

/* ── Helper: fetch common booking data ── */
async function getBookingData(userId: string) {
  const [wallet, pricing, openEvents, _upcomingExams, examComponents] = await Promise.all([
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
  const uniqueMap = new Map<string, { id: string; code: string; name: string }>()
  examComponents.forEach((ec) => {
    if (!uniqueMap.has(ec.course.code)) {
      uniqueMap.set(ec.course.code, { id: ec.id, code: ec.course.code, name: ec.course.name })
    }
  })
  const ecMapped = Array.from(uniqueMap.values()).sort((a, b) =>
    a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' })
  )

  // Compute eligible components for resit: user must have failed these previously
  const failedResults = await prisma.examResult.findMany({
    where: { userId, passed: false },
    include: { exam: { include: { examComponent: true } } },
  })
  
  const eligibleIds = new Set<string>()
  failedResults.forEach((r) => { if (r.exam?.examComponentId) eligibleIds.add(r.exam.examComponentId) })

  // Determine which components the user has "active" memberships for
  const activeMemberships = await prisma.poolMembership.findMany({
    where: { userId, status: { in: ACTIVE_MEMBERSHIP_STATUSES } },
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

  const { wallet: _wallet, pricing, balance, currency, currencySymbol, openEvents } = await getBookingData(session.user.id)

  const [failedResults, failedBookings] = await Promise.all([
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
      where: { userId: session.user.id, result: { equals: 'fail', mode: 'insensitive' } },
      include: {
        course: true,
        exam: { include: { examComponent: { include: { course: true } }, event: true } },
      }
    })
  ])

  // Audit 4e: free-resit balance comes from real ExamBundle entitlement
  // (freeResitsIncluded / usedFreeResits) instead of guessing from pool
  // membership counts. Earliest-expiring bundle listed first.
  const resitBundles = await prisma.examBundle.findMany({
    where: {
      userId: session.user.id,
      validUntil: { gt: new Date() },
      status: { in: ['ACTIVE', 'USED', 'EXHAUSTED'] },
    },
    select: {
      id: true,
      bundleType: true,
      freeResitsIncluded: true,
      usedFreeResits: true,
      validUntil: true,
    },
    orderBy: { validUntil: 'asc' },
  })

  const freeResits = resitBundles
    .map((b) => ({
      bookingGroupRef: b.id,
      bookingType: b.bundleType === 'FOUR_SEAT' ? 'Four Pack' : 'Twin Pack',
      remaining: Math.max(0, b.freeResitsIncluded - b.usedFreeResits),
      notes: null as string | null,
    }))
    .filter((r) => r.remaining > 0)

  // Deduplicate and map failed exams by Module Code to handle legacy migrated data
  const failedMap = new Map<string, {
    examId: string
    examName: string
    moduleCode: string
    moduleName: string
    score: number
    passingScore: number
    examDate: string
    eventName: string | null
    examComponentId: string | null
  }>()

  failedResults.forEach((r) => {
    const code = r.moduleCode || r.exam?.examComponent?.course?.code || '—'
    if (code !== '—') {
      failedMap.set(code, {
        examId: r.examId || r.id,
        examName: r.exam?.name || 'Historical Exam',
        moduleCode: code,
        moduleName: r.exam?.examComponent?.course?.name || '—',
        score: r.score ? Number(r.score) : 0,
        passingScore: r.exam?.passingScore ? Number(r.exam.passingScore) : ACADEMIC_RULES.EASA_PASS_MARK,
        examDate: (r.exam?.examDate || r.createdAt).toISOString(),
        eventName: r.exam?.event?.name || null,
        examComponentId: r.exam?.examComponentId || null,
      })
    }
  })

  failedBookings.forEach((b) => {
    const code = b.moduleCode || b.course?.code || b.exam?.examComponent?.course?.code || '—'
    // Only add if not already in map (preferring formal result data if both exist)
    if (code !== '—' && !failedMap.has(code)) {
      failedMap.set(code, {
        examId: b.examId || b.id,
        examName: b.exam?.name || b.course?.name || 'Historical Booking',
        moduleCode: code,
        moduleName: b.course?.name || b.exam?.examComponent?.course?.name || '—',
        score: b.score ? Number(b.score) : 0,
        passingScore: ACADEMIC_RULES.EASA_PASS_MARK,
        examDate: (b.examDate || b.createdAt).toISOString(),
        eventName: b.exam?.event?.name || null,
        examComponentId: b.exam?.examComponentId || b.course?.id || null,
      })
    }
  })

  // Exclude active module memberships
  const activeMemberships = await prisma.poolMembership.findMany({
    where: { userId: session.user.id, status: { in: ACTIVE_MEMBERSHIP_STATUSES } },
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
