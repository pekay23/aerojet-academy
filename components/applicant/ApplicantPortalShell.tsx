import ApplicantSidebar from '@/app/applicant/_components/ApplicantSidebar'
import BreadcrumbNav from '@/components/layouts/BreadcrumbNav'
import PortalHeader from '@/components/layouts/PortalHeader'
import TourTrigger from '@/components/Tour/TourTrigger'

export interface ApplicantPortalShellProps {
  userName: string
  userRole: string
  userImage?: string
  hasPathway: boolean
  isExamOnly: boolean
  pipelineEnabled: boolean
  applicationStage: string | null
  enabledStageGroups?: {
    documents: boolean
    aptitude: boolean
    interview: boolean
    medical: boolean
  }
  children: React.ReactNode
}

/**
 * Shared shell for the applicant portal: sidebar + header + breadcrumb + content
 * area. Extracted from `app/applicant/layout.tsx` so the auth-gated chrome is
 * defined once and reused by every applicant route (S-1).
 */
export function ApplicantPortalShell({
  userName,
  userRole,
  userImage,
  hasPathway,
  isExamOnly,
  pipelineEnabled,
  applicationStage,
  enabledStageGroups,
  children,
}: ApplicantPortalShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <ApplicantSidebar
        userName={userName}
        userRole={userRole}
        userImage={userImage}
        hasPathway={hasPathway}
        isExamOnly={isExamOnly}
        pipelineEnabled={pipelineEnabled}
        applicationStage={applicationStage}
        enabledStageGroups={enabledStageGroups}
      />
      <main
        id="main-content"
        className="relative min-h-screen min-w-0 flex-1 overflow-x-hidden pt-16 lg:pt-0"
      >
        <div className="mx-auto max-w-[1920px] p-4 pt-16 sm:p-8 lg:px-8 lg:py-6 lg:pt-10">
          <PortalHeader actions={<TourTrigger title="Take a tour of your application" />}>
            <BreadcrumbNav />
          </PortalHeader>
          {children}
        </div>
      </main>
    </div>
  )
}
