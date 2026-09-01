import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import ApplicantSidebar from './_components/ApplicantSidebar'
import BreadcrumbNav from '@/components/layouts/BreadcrumbNav'
import PortalHeader from '@/components/layouts/PortalHeader'
import TourTrigger from '@/components/Tour/TourTrigger'
import AppTour from '@/components/Tour/AppTour'
import { prismaUnfiltered } from '@/lib/prisma/client'
import ForcePasswordChange from './_components/ForcePasswordChange'
import { resolveEffectiveEnrollmentType, resolveEffectivePathwayCode } from '@/lib/enrollment/pathway'
import { getPipelineStageConfig, isPipelineEnabled } from '@/lib/admissions/state-machine'

export const dynamic = 'force-dynamic'

export default async function ApplicantLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const user = session.user
  if (!['APPLICANT'].includes(user.role)) redirect('/login')

  // Single consolidated query instead of 4 sequential queries
  const dbUser = await prismaUnfiltered.user.findUnique({
    where: { id: user.id },
    select: {
      status: true,
      role: true,
      mustChangePassword: true,
      programmeChoice: true,
      profile: { select: { firstName: true, lastName: true } },
      studentProfile: {
        select: { pathwayId: true, enrollmentType: true, pathwayRel: { select: { code: true } } },
      },
      fullTimeEnrollments: { take: 1, select: { id: true } },
      application: { select: { stage: true, programmeChoice: true } },
    },
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

  const profile = dbUser.profile
  const studentProfile = dbUser.studentProfile
  const hasFullTimeEnrollment = (dbUser.fullTimeEnrollments?.length ?? 0) > 0 ? { id: dbUser.fullTimeEnrollments[0].id } : null

  const effectivePathwayCode = resolveEffectivePathwayCode({
    pathwayCode: studentProfile?.pathwayRel?.code,
    enrollmentType: studentProfile?.enrollmentType,
    programmeChoice: dbUser.programmeChoice,
  })
  const effectiveEnrollmentType = resolveEffectiveEnrollmentType({
    pathwayCode: studentProfile?.pathwayRel?.code,
    enrollmentType: studentProfile?.enrollmentType,
    programmeChoice: dbUser.programmeChoice,
  })

  const hasPathway = !!effectivePathwayCode || !!studentProfile?.pathwayId || !!hasFullTimeEnrollment
  const isExamOnly = effectiveEnrollmentType === 'EXAM_ONLY'
  const pipelineEnabled = await isPipelineEnabled()
  const applicationStage = dbUser.application?.stage ?? null
  const enabledStageGroups = dbUser.application
    ? await getPipelineStageConfig(dbUser.application.programmeChoice)
    : undefined

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
        pipelineEnabled={pipelineEnabled}
        applicationStage={applicationStage}
        enabledStageGroups={enabledStageGroups}
      />
      <AppTour hasCompletedTour={dbUser.hasCompletedTour} userRole={userRole} />
      <main id="main-content" className="relative pt-16 lg:pt-0 min-h-screen min-w-0 flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-[1920px] p-4 pt-16 sm:p-8 lg:px-8 lg:py-6 lg:pt-10">
          <PortalHeader actions={<TourTrigger aria-label="Take a guided tour" title="Take a tour of this portal" />}>
            <BreadcrumbNav />
          </PortalHeader>
          {children}
        </div>
      </main>
    </div>
  )
}
