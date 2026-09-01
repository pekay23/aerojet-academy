import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import NotificationsList from '@/app/student/notifications/_components/NotificationsList'
import { PageTransition } from '@/components/shared/PageTransition'

export const metadata: Metadata = {
  title: 'Notifications | Applicant Portal',
  description: 'View your notifications and alerts.',
}

type SearchParams = { [key: string]: string | string[] | undefined }

export default async function ApplicantNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const sp = await searchParams
  const limit = Math.min(100, Math.max(1, parseInt((sp.limit as string) || '50', 10)))
  const page = Math.max(1, parseInt((sp.page as string) || '1', 10))
  const skip = (page - 1) * limit

  const userId = session.user.id
  const where = { userId }

  const [notifications, unreadCount] = await Promise.all([
    prismaUnfiltered.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prismaUnfiltered.notification.count({
      where: { userId, isRead: false },
    }),
  ])

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Stay updated with academy announcements and alerts.
            </p>
          </div>
          {unreadCount > 0 && (
            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white shadow-lg shadow-blue-100">
              {unreadCount} New
            </span>
          )}
        </div>

        <NotificationsList notifications={notifications} />
      </div>
    </PageTransition>
  )
}
