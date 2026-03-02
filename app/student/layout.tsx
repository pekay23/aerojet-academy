import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import StudentSidebar from './_components/StudentSidebar'
import BreadcrumbNav from '@/components/layouts/BreadcrumbNav'
import WelcomeBanner from '@/components/WelcomeBanner'
import ForcePasswordChange from '../applicant/_components/ForcePasswordChange'
import { getWelcomeMessages } from '@/lib/welcome-messages'
import { getStudentPaymentAccessLevel, getEnrollmentMilestoneStatus } from '@/lib/access-control'

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
  if (dbUser.mustChangePassword) {
    return (
      <ForcePasswordChange
        apiEndpoint="/api/student/profile/change-password"
        portalName="Student Portal"
      />
    )
  }

  const userName = user.name || user.email
  const userRole = user.role

  const [
    unreadNotifications,
    unreadMessages,
    studentProfile,
    paymentAccessLevel,
    milestoneStatus,
    wallet,
  ] = await Promise.all([
    prisma.notification.count({
      where: { userId: user.id, isRead: false },
    }),
    prisma.message.count({
      where: { recipientId: user.id, isRead: false },
    }),
    prisma.studentProfile.findUnique({
      where: { userId: user.id },
      select: {
        pathwayId: true,
        pathwayRel: { select: { code: true, name: true } },
        enrollmentType: true,
      },
    }),
    getStudentPaymentAccessLevel(user.id),
    getEnrollmentMilestoneStatus(user.id),
    prisma.wallet.findUnique({
      where: { userId: user.id },
      select: { availableBalance: true, reservedBalance: true, currency: true },
    }),
  ])

  // A student "has a pathway" if they have either a specific study pathway (B1/B2)
  // or a general enrollment type (Modular/Exam-Only).
  const hasPathway = !!studentProfile?.pathwayId || !!studentProfile?.enrollmentType

  // Convert milestoneStatus dates for client components
  const milestoneStatusJson = {
    ...milestoneStatus,
    milestones: milestoneStatus.milestones.map((m) => ({
      ...m,
      dueDate: m.dueDate.toISOString(),
      paidAt: m.paidAt?.toISOString() ?? null,
    })),
  }

  const walletBalance = {
    available: Number(wallet?.availableBalance ?? 0),
    held: Number(wallet?.reservedBalance ?? 0),
    currency: wallet?.currency ?? 'EUR',
  }

  // Store payment info in a way that can be passed via context or accessed by pages
  const paymentInfo = {
    accessLevel: paymentAccessLevel,
    milestoneStatus: milestoneStatusJson,
    walletBalance,
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <StudentSidebar
        userName={userName}
        userRole={userRole}
        userImage={user.image || undefined}
        studyPathway={studentProfile?.pathwayRel?.code || (studentProfile?.enrollmentType as any)}
        notificationCount={unreadNotifications}
        messageCount={unreadMessages}
        paymentAccessLevel={paymentAccessLevel}
      />
      <main className="min-h-screen flex-1">
        <div className="p-4 pt-16 sm:p-8 lg:p-10 lg:pt-10">
          <BreadcrumbNav />
          {hasPathway ? (
            <div className="payment-info" data-payment-info={JSON.stringify(paymentInfo)}>
              {children}
            </div>
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
