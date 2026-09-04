import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen,
  GraduationCap,
  Clock,
  ChevronRight,
} from 'lucide-react'
import { Suspense } from 'react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import {
  canAccessFeature,
  getEnrollmentMilestoneStatus,
  getStudentPaymentAccessLevel,
  getStudentStatus,
} from '@/lib/access-control'
import { PaymentRequiredBanner } from '../_components/PaymentRequiredBanner'

export const metadata: Metadata = {
  title: 'My Courses | Student Portal',
  description: 'View and manage your enrolled courses.',
}

export default async function CoursesPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { isFullTime, isExamOnly, isModular: _isModular } = await getStudentStatus(session.user.id)
  const hasAccess = await canAccessFeature(session.user.id, 'courses')

  if (isFullTime && !hasAccess) {
    const [milestoneStatus, wallet, accessLevel] = await Promise.all([
      getEnrollmentMilestoneStatus(session.user.id),
      prisma.wallet.findUnique({
        where: { userId: session.user.id },
        select: { availableBalance: true, reservedBalance: true, currency: true },
      }),
      getStudentPaymentAccessLevel(session.user.id),
    ])

    const walletBalance = {
      available: Number(wallet?.availableBalance ?? 0),
      held: Number(wallet?.reservedBalance ?? 0),
      currency: wallet?.currency ?? 'EUR',
    }

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-blue-800 dark:text-white">
            My Courses
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your active and upcoming courses.
          </p>
        </div>

        <PaymentRequiredBanner
          accessLevel={accessLevel}
          milestoneStatus={milestoneStatus}
          walletBalance={walletBalance}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-blue-800 dark:text-white">
            My Courses
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your active and upcoming courses.
          </p>
        </div>
        {!isFullTime && !isExamOnly && (
          <Link
            href="/student/courses/enroll"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-800 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-800/90 hover:shadow-lg active:scale-95"
          >
            <BookOpen className="h-4 w-4" />
            Enroll in New Course
          </Link>
        )}
      </div>

      <Suspense fallback={<CoursesSkeleton />}>
        <CourseList userId={session.user.id} canEnroll={!isFullTime && !isExamOnly} />
      </Suspense>
    </div>
  )
}

function CoursesSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-100" />
      ))}
    </div>
  )
}

async function CourseList({ userId, canEnroll }: { userId: string; canEnroll: boolean }) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          category: true,
        },
      },
    },
    orderBy: { enrolledAt: 'desc' },
    take: 50,
  })

  if (enrollments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-800/50">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm dark:bg-slate-900">
          <BookOpen className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Not enrolled in any courses
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          You haven&apos;t enrolled in any courses yet. Browse our available courses to get started
          with your training.
        </p>
        {canEnroll && (
          <div className="mt-8">
            <Link
              href="/student/courses/enroll"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
            >
              Browse Course Catalog
            </Link>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {enrollments.map((enrollment) => (
        <Link
          key={enrollment.id}
          href={`/student/courses/${enrollment.course.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-')}`}
          className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          {/* Header */}
          <div className="bg-slate-50 p-6 transition-colors group-hover:bg-blue-50/50 dark:bg-slate-800/50">
            <div className="mb-4 flex items-center justify-between">
              <span
                className={`rounded-lg px-2 py-1 text-xs font-black tracking-widest uppercase ${
                  enrollment.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-700'
                    : enrollment.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-200 text-slate-700'
                }`}
              >
                {enrollment.status}
              </span>
              <BookOpen className="h-5 w-5 text-slate-400 group-hover:text-blue-500" />
            </div>
            <h3 className="line-clamp-2 font-black text-slate-900 dark:text-slate-100">
              {enrollment.course.name}
            </h3>
            <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
              {enrollment.course.code}
            </p>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col p-6">
            <div className="mb-4 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{enrollment.course.duration || 'Flexible'} hrs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" />
                <span>{enrollment.course.category?.name || 'Uncategorized'}</span>
              </div>
            </div>

            <div className="mt-auto flex items-center justify-between">
              <span className="text-xs font-bold text-blue-600 group-hover:underline">
                View Details
              </span>
              <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
