import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import ApplicantSidebar from './_components/ApplicantSidebar'
import BreadcrumbNav from '@/components/layouts/BreadcrumbNav'
import PortalHeader from '@/components/layouts/PortalHeader'
import prisma from '@/lib/prisma/client'
import ForcePasswordChange from './_components/ForcePasswordChange'

export default async function ApplicantLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const user = session.user
  if (!['APPLICANT'].includes(user.role)) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { status: true, role: true, mustChangePassword: true, programmeChoice: true },
  })

  if (
    !dbUser ||
    ['SUSPENDED', 'DELETED', 'ARCHIVED'].includes(dbUser.status) ||
    dbUser.role !== 'APPLICANT'
  ) {
    redirect('/login')
  }

  // Force password change if required
  if (dbUser.mustChangePassword) {
    return <ForcePasswordChange />
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { firstName: true, lastName: true },
  })

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: { pathwayId: true },
  })

  const hasFullTimeEnrollment = await prisma.fullTimeEnrollment.findFirst({
    where: { studentId: user.id },
    select: { id: true },
  })

  const hasPathway = !!studentProfile?.pathwayId || !!hasFullTimeEnrollment
  const isExamOnly = dbUser?.programmeChoice === 'EXAM_ONLY'

  const userName = profile ? `${profile.firstName} ${profile.lastName}` : (user.email ?? '')
  const userRole = 'Applicant'

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <ApplicantSidebar
        userName={userName}
        userRole={userRole}
        userImage={user.image ?? undefined}
        hasPathway={hasPathway}
        isExamOnly={isExamOnly}
      />
      <main id="main-content" className="relative pt-16 lg:pt-0 min-h-screen min-w-0 flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-[1600px] p-4 pt-16 sm:p-8 lg:p-10 lg:pt-10">
          <PortalHeader>
            <BreadcrumbNav />
          </PortalHeader>
          {children}
        </div>
      </main>
    </div>
  )
}
