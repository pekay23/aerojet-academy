import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import StudentSidebar from './_components/StudentSidebar'
import BreadcrumbNav from '@/components/layouts/BreadcrumbNav'
import PortalHeader from '@/components/layouts/PortalHeader'
import WelcomeBanner from '@/components/WelcomeBanner'
import StudentTopbarActions from './_components/StudentTopbarActions'
import DynamicPageHeader from './_components/DynamicPageHeader'
import ForcePasswordChange from '../applicant/_components/ForcePasswordChange'
import { getWelcomeMessages } from '@/lib/welcome-messages'
import { getStudentPaymentAccessLevel, getEnrollmentMilestoneStatus } from '@/lib/access-control'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const user = session.user

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      status: true,
      role: true,
      mustChangePassword: true,
      profile: { select: { firstName: true, middleName: true, lastName: true } },
    },
  })

  if (
    !dbUser ||
    ['SUSPENDED', 'DELETED', 'ARCHIVED'].includes(dbUser.status) ||
    dbUser.role !== 'STUDENT'
  ) {
    redirect('/login')
  }

  if (dbUser.mustChangePassword) {
    return (
      <ForcePasswordChange
        apiEndpoint="/api/student/profile/change-password"
        portalName="Student Portal"
      />
    )
  }

  const userName = dbUser?.profile
    ? [dbUser.profile.firstName, dbUser.profile.middleName, dbUser.profile.lastName]
        .filter(Boolean)
        .join(' ')
    : user.name || user.email
  const userRole = user.role

  const [
    unreadNotifications,
    unreadMessages,
    recentNotifications,
    recentMessages,
    studentProfile,
    paymentAccessLevel,
    milestoneStatus,
    wallet,
    welcomeMessages,
  ] = await Promise.all([
    prisma.notification.count({
      where: { userId: user.id, isRead: false },
    }),
    prisma.message.count({
      where: { recipientId: user.id, isRead: false },
    }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        isRead: true,
        createdAt: true,
        linkUrl: true,
      },
    }),
    prisma.message.findMany({
      where: { recipientId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        subject: true,
        body: true,
        isRead: true,
        createdAt: true,
        sender: {
          select: {
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
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
    getWelcomeMessages(prisma, session.user.role),
  ])

  const hasPathway = !!studentProfile?.pathwayId || !!studentProfile?.enrollmentType

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

  const paymentInfo = {
    accessLevel: paymentAccessLevel,
    milestoneStatus: milestoneStatusJson,
    walletBalance,
  }

  const firstName = dbUser?.profile?.firstName || user.name?.split(' ')[0] || ''

  // Transform messages to match TopbarMessage interface
  const transformedMessages = recentMessages.map((msg) => ({
    ...msg,
    sender: {
      name: msg.sender.profile
        ? `${msg.sender.profile.firstName} ${msg.sender.profile.lastName}`
        : null,
      email: msg.sender.email,
    },
  }))

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
      <main id="main-content" className="min-h-screen min-w-0 flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-7xl p-4 pt-16 sm:p-8 lg:p-10 lg:pt-10">
          <PortalHeader
            actions={
              <StudentTopbarActions
                initialNotifications={JSON.parse(JSON.stringify(recentNotifications))}
                initialMessages={JSON.parse(JSON.stringify(transformedMessages))}
                initialUnreadNotifications={unreadNotifications}
                initialUnreadMessages={unreadMessages}
              />
            }
          >
            <BreadcrumbNav />
          </PortalHeader>
          {hasPathway ? (
            <div className="payment-info" data-payment-info={JSON.stringify(paymentInfo)}>
              {children}
            </div>
          ) : (
            <div className="space-y-8">
              <WelcomeBanner messages={welcomeMessages} userName={firstName} />
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
