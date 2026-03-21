import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma/client'
import { AlertTriangle } from 'lucide-react'
import StudentSidebar from './_components/StudentSidebar'
import BreadcrumbNav from '@/components/layouts/BreadcrumbNav'
import PortalHeader from '@/components/layouts/PortalHeader'
import WelcomeBanner from '@/components/WelcomeBanner'
import StudentTopbarActions from './_components/StudentTopbarActions'
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
      registrationPaid: true,
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

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <StudentSidebar
        userName={userName}
        userRole={userRole}
        userImage={user.image || undefined}
        studyPathway={studentProfile?.pathwayRel?.code || (studentProfile?.enrollmentType as any)}
        notificationCount={unreadNotifications}
        messageCount={unreadMessages}
        paymentAccessLevel={paymentAccessLevel}
      />
      <main id="main-content" className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="sticky top-0 z-30 border-b border-slate-100 bg-slate-50/80 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/80">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-8 lg:px-8">
            <PortalHeader
              actions={<StudentTopbarActions />}
            >
              <BreadcrumbNav />
            </PortalHeader>
          </div>
        </div>
        {!dbUser.registrationPaid && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
            <div className="mx-auto flex max-w-7xl items-center gap-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                Registration fee unpaid.{' '}
                <Link href="/student/registration-fee" className="underline hover:no-underline">
                  Pay now
                </Link>{' '}
                to enroll in courses.
              </p>
            </div>
          </div>
        )}
        <div className="mx-auto max-w-7xl p-4 sm:p-8 lg:px-8 lg:py-6">
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
