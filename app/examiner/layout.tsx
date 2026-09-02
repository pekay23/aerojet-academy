import { requireExaminer } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import ExaminerSidebar from './_components/ExaminerSidebar'
import Heartbeat from '@/components/shared/Heartbeat'
import BreadcrumbNav from '@/components/layouts/BreadcrumbNav'
import AppTour from '@/components/Tour/AppTour'
import TourTrigger from '@/components/Tour/TourTrigger'
import { Toaster } from 'sonner'

export const dynamic = 'force-dynamic'

export default async function ExaminerLayout({ children }: { children: React.ReactNode }) {
  // Enforce security at the layout level — throws if not an examiner
  const session = await requireExaminer()

  const [dbUser, pendingExamReports, unreadNotifications] = await Promise.all([
    prismaUnfiltered.user.findUnique({
      where: { id: session.id },
      select: { hasCompletedTour: true },
    }),
    prismaUnfiltered.internalExamReport.count({
      where: { status: 'PENDING' },
    }),
    prismaUnfiltered.notification.count({ where: { userId: session.id, isRead: false } }),
  ])

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-slate-900 focus:shadow-lg dark:focus:bg-slate-800 dark:focus:text-white">
        Skip to main content
      </a>
      <Heartbeat />
      <AppTour
        hasCompletedTour={dbUser?.hasCompletedTour ?? false}
        userRole={session.role}
        data={{ pendingExamReports, unreadNotifications }}
      />
      <ExaminerSidebar />
      <main id="main-content" className="flex-1 overflow-y-auto px-8 py-10">
        <div className="mb-6 flex items-center justify-between">
          <BreadcrumbNav />
          <TourTrigger title="Take a tour of your examiner portal" />
        </div>
        <div className="mx-auto max-w-[1920px] animate-in fade-in slide-in-from-bottom-4 duration-500 motion-reduce:animate-none motion-reduce:transition-none">
          {children}
        </div>
      </main>
      <Toaster position="top-right" richColors />
    </div>
  )
}
