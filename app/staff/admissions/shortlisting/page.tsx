import { Metadata } from 'next'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { calculateApplicationScore } from '@/lib/admissions/scoring'
import ShortlistingTable from './_components/ShortlistingTable'

export const metadata: Metadata = { title: 'Shortlisting Dashboard' }
export const dynamic = 'force-dynamic'

export default async function ShortlistingPage() {
  await requireStaff()

  // Find all applications waiting to be shortlisted (include aptitudeTestSessions to avoid N+1)
  const applications = await prismaUnfiltered.application.findMany({
    where: { stage: 'APTITUDE_COMPLETED' },
    include: {
      user: {
        include: {
          profile: true,
          aptitudeTestSessions: {
            where: { status: 'COMPLETED' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
      intakeCycle: true,
      documents: {
        include: {
          fileUpload: true,
          documentType: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Calculate scores for all applicants (pass pre-loaded data to avoid re-fetching)
  const scoredApplications = await Promise.all(
    applications.map(async (app) => {
      const scoreResult = await calculateApplicationScore(app)
      
      const cvDoc = app.documents.find((d) => d.documentType.slug.toLowerCase().includes('cv') || d.documentType.slug.toLowerCase().includes('resume'))
      
      return {
        id: app.id,
        applicantName: app.user.profile
          ? `${app.user.profile.firstName ?? ''} ${app.user.profile.lastName ?? ''}`.trim() || app.user.email
          : app.user.email,
        email: app.user.email,
        programmeChoice: app.programmeChoice,
        intakeCycle: app.intakeCycle?.name || 'Unknown Cycle',
        cvUrl: cvDoc?.fileUpload?.url || null,
        scores: scoreResult || {
          compositeScore: 0,
          aptitudeScore: 0,
          profileScore: 0,
          referralScore: 0,
          experienceScore: 0,
          isAutoShortlist: false,
          isAutoReject: false,
        },
        metadata: app.metadata,
      }
    })
  )

  // Sort by composite score descending
  scoredApplications.sort((a, b) => b.scores.compositeScore - a.scores.compositeScore)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Shortlisting Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review and shortlist candidates who have completed the aptitude test.
          </p>
        </div>
      </div>

      <ShortlistingTable data={scoredApplications} />
    </div>
  )
}
