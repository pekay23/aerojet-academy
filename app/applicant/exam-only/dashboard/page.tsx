import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Wallet,
  ClipboardList,
  BookOpen,
  CreditCard,
  ArrowRight,
  Clock,
  _CheckCircle2,
  _AlertCircle,
  Package,
} from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered, prisma } from '@/lib/prisma/client'

export const metadata: Metadata = { title: 'Dashboard | Exam-Only Portal' }
export const dynamic = 'force-dynamic'

export default async function ExamOnlyDashboardPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const userId = session.user.id

  const user = await prismaUnfiltered.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      programmeChoice: true,
      status: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  })

  if (!user) redirect('/login')

  if (user.role === 'STUDENT') {
    redirect('/student')
  }

  const firstName = user.profile?.firstName ?? 'Applicant'

  // Fetch wallet
  const wallet = await prismaUnfiltered.wallet.findUnique({
    where: { userId },
    select: {
      balance: true,
      reservedBalance: true,
      availableBalance: true,
      currency: true,
    },
  })

  const balance = wallet ? Number(wallet.balance) : 0
  const reserved = wallet ? Number(wallet.reservedBalance) : 0
  const available = wallet ? Number(wallet.availableBalance) : 0
  const currency = wallet?.currency ?? 'EUR'

  // Fetch recent exam bookings
  const recentBookings = await prisma.examBooking.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      examComponent: {
        select: { code: true, name: true },
      },
    },
  })

  // Fetch active exam bundles (confirmed bookings with future exam dates)
  const activeBundles = await prisma.examBooking.findMany({
    where: {
      userId,
      status: 'APPROVED',
      examDate: { gte: new Date() },
    },
    orderBy: { examDate: 'asc' },
    include: {
      examComponent: {
        select: { code: true, name: true },
      },
    },
  })

  const formatCurrency = (amount: number) =>
    `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const statusColors: Record<string, { bg: string; text: string }> = {
    APPROVED: { bg: 'bg-green-50', text: 'text-green-700' },
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700' },
    REJECTED: { bg: 'bg-red-50', text: 'text-red-700' },
    FAILED: { bg: 'bg-red-50', text: 'text-red-700' },
    COMPLETED: { bg: 'bg-blue-50', text: 'text-blue-700' },
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-700">
      {/* Welcome Card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-aerojet-blue text-3xl font-black tracking-tight dark:text-white">
          Welcome, {firstName}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Your exam-only dashboard. Book exams, manage your wallet, and track your progress.
        </p>
      </div>

      {/* Wallet Summary */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800">
              <Wallet className="text-aerojet-blue h-5 w-5 dark:text-slate-300" />
            </div>
            <h2 className="text-aerojet-blue text-lg font-black dark:text-white">Wallet Balance</h2>
          </div>
          <Link
            href="/applicant/wallet-top-up"
            className="bg-aerojet-blue inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold tracking-widest text-white uppercase transition-all hover:bg-[#001d42]"
          >
            <CreditCard className="h-4 w-4" />
            Top Up
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
              Total Balance
            </p>
            <p className="text-aerojet-blue mt-1 text-xl font-black dark:text-white">
              {formatCurrency(balance)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Available</p>
            <p className="mt-1 text-xl font-black text-green-600 dark:text-green-400">
              {formatCurrency(available)}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Reserved</p>
            <p className="mt-1 text-xl font-black text-amber-600 dark:text-amber-400">
              {formatCurrency(reserved)}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Book Exam',
            href: '/applicant/exam-only',
            icon: ClipboardList,
            description: 'Browse and book available exam sessions',
          },
          {
            label: 'Top Up Wallet',
            href: '/applicant/wallet-top-up',
            icon: CreditCard,
            description: 'Add funds to your exam wallet',
          },
          {
            label: 'Browse Courses',
            href: '/applicant/courses',
            icon: BookOpen,
            description: 'View available courses and modules',
          },
        ].map(({ label, href, icon: Icon, description }) => (
          <Link
            key={label}
            href={href}
            className="group hover:border-aerojet-sky flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 transition-all hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="group-hover:bg-aerojet-blue flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 transition-colors dark:bg-slate-800/50">
              <Icon className="h-5 w-5 text-slate-400 transition-colors group-hover:text-white" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
              <p className="text-xs text-slate-400 dark:text-slate-500">{description}</p>
            </div>
            <ArrowRight className="group-hover:text-aerojet-sky h-4 w-4 text-slate-300" />
          </Link>
        ))}
      </div>

      {/* Active Exam Bundles */}
      {activeBundles.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800">
              <Package className="text-aerojet-blue h-5 w-5 dark:text-slate-300" />
            </div>
            <h2 className="text-aerojet-blue text-lg font-black dark:text-white">Upcoming Exams</h2>
          </div>
          <div className="space-y-3">
            {activeBundles.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-4 dark:border-slate-800"
              >
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {booking.examComponent?.code ?? booking.moduleCode ?? 'Exam'}{' '}
                    {booking.examComponent?.name && (
                      <span className="font-normal text-slate-400">
                        — {booking.examComponent.name}
                      </span>
                    )}
                  </p>
                  {booking.examDate && (
                    <p className="text-xs text-slate-400">
                      {new Date(booking.examDate).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-900/20 dark:text-green-400">
                  Approved
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Exam Bookings */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800">
              <Clock className="text-aerojet-blue h-5 w-5 dark:text-slate-300" />
            </div>
            <h2 className="text-aerojet-blue text-lg font-black dark:text-white">
              Recent Bookings
            </h2>
          </div>
          <Link
            href="/applicant/exam-only"
            className="text-aerojet-sky text-xs font-bold hover:underline"
          >
            View All
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="rounded-xl bg-slate-50 p-8 text-center dark:bg-slate-800/50">
            <ClipboardList className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No exam bookings yet. Start by booking an exam.
            </p>
            <Link
              href="/applicant/exam-only"
              className="text-aerojet-sky mt-3 inline-flex items-center gap-2 text-xs font-bold hover:underline"
            >
              Book your first exam <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentBookings.map((booking) => {
              const colors = statusColors[booking.status] ?? {
                bg: 'bg-slate-50',
                text: 'text-slate-700',
              }
              return (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-4 dark:border-slate-800"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {booking.examComponent?.code ?? booking.moduleCode ?? 'Exam'}{' '}
                      {booking.examComponent?.name && (
                        <span className="font-normal text-slate-400">
                          — {booking.examComponent.name}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(booking.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {' — '}
                      {formatCurrency(Number(booking.amountPaid))}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${colors.bg} ${colors.text}`}
                  >
                    {booking.status}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
