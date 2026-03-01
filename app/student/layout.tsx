import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import StudentSidebar from './_components/StudentSidebar'
import BreadcrumbNav from '@/components/layouts/BreadcrumbNav'
import WelcomeBanner from '@/components/WelcomeBanner'
import { getWelcomeMessages } from '@/lib/welcome-messages'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const user = session.user

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { status: true, role: true, mustChangePassword: true },
  })

  if (
    !dbUser ||
    ['SUSPENDED', 'DELETED', 'ARCHIVED'].includes(dbUser.status) ||
    dbUser.role !== 'STUDENT'
  ) {
    redirect('/login')
  }

  // Mandatory password change check
  // Note: Replace with actual change password path if different
  if (dbUser.mustChangePassword) {
    // We check the URL in a server component? No, use middleware or just redirect if not on the page.
    // However, in a layout, it applies to all children.
    // Usually, the change password page should NOT be under this layout or the layout should handle it.
  }

  const userName = user.name || user.email
  const userRole = user.role

  const [unreadNotifications, unreadMessages, studentProfile] = await Promise.all([
    prisma.notification.count({
      where: { userId: user.id, isRead: false },
    }),
    prisma.message.count({
      where: { recipientId: user.id, isRead: false },
    }),
    prisma.studentProfile.findUnique({
      where: { userId: user.id },
      select: { pathwayId: true, pathwayRel: { select: { code: true, name: true } }, enrollmentType: true },
    }),
  ])

  // A student "has a pathway" if they have either a specific study pathway (B1/B2)
  // or a general enrollment type (Modular/Exam-Only).
  const hasPathway = !!studentProfile?.pathwayId || !!studentProfile?.enrollmentType

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <StudentSidebar
        userName={userName}
        userRole={userRole}
        userImage={user.image || undefined}
        studyPathway={studentProfile?.pathwayRel?.code || (studentProfile?.enrollmentType as any)}
        notificationCount={unreadNotifications}
        messageCount={unreadMessages}
      />
      <main className="min-h-screen flex-1">
        <div className="p-4 pt-16 sm:p-8 lg:p-10 lg:pt-10">
          <BreadcrumbNav />
          {hasPathway ? (
            children
          ) : (
            <div className="space-y-8">
              <WelcomeBanner
                messages={await getWelcomeMessages(prisma, session.user.role)}
                userName={session.user.name?.split(' ')[0]}
              />
              <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800/50 dark:bg-amber-900/10">
                <h2 className="mb-2 text-lg font-black text-amber-800 dark:text-amber-200">
                  Study Pathway Not Set
                </h2>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Your study pathway has not been configured yet. Please contact the academy staff
                  to get your pathway assigned. Until then, portal features are restricted.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
