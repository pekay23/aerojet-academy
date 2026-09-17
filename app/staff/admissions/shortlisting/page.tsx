import { Metadata } from 'next'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { calculateApplicationScore } from '@/lib/admissions/scoring'
import ShortlistingTable from './_components/ShortlistingTable'

export const metadata: Metadata = { title: 'Shortlisting Dashboard' }
export const dynamic = 'force-dynamic'

export default async function ShortlistingPage() {
  await requireStaff()

  // Find all applications waiting to be shortlisted (include aptitudeTestSessions with sub-scores)
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
            select: {
              percentage: true,
              overallPercentile: true,
              mathRawScore: true,
              mathTotalQuestions: true,
              mathPercentile: true,
              verbalRawScore: true,
              verbalTotalQuestions: true,
              verbalPercentile: true,
              engineeringRawScore: true,
              engineeringTotalQuestions: true,
              engineeringPercentile: true,
              reasoningRawScore: true,
              reasoningTotalQuestions: true,
              reasoningPercentile: true,
              physicsRawScore: true,
              physicsTotalQuestions: true,
              physicsPercentile: true,
            },
          },
        },
      },
      intakeCycle: true,
      interviewEvaluations: {
        select: { personalScore: true },
      },
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

      // Extract sub-score data from the session for the UI
      const session = app.user.aptitudeTestSessions?.[0]
      
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
          aptitudePercentile: null,
          profileScore: 0,
          referralScore: 0,
          experienceScore: 0,
          interviewScore: null,
          interviewEvaluatorCount: 0,
          isAutoShortlist: false,
          isAutoReject: false,
          mathRawScore: null,
          mathPercentile: null,
          verbalRawScore: null,
          verbalPercentile: null,
          engineeringRawScore: null,
          engineeringPercentile: null,
          reasoningRawScore: null,
          reasoningPercentile: null,
        },
        // Per-category detail for the expandable row
        subScores: session ? {
          math: { raw: session.mathRawScore, total: session.mathTotalQuestions, percentile: session.mathPercentile },
          verbal: { raw: session.verbalRawScore, total: session.verbalTotalQuestions, percentile: session.verbalPercentile },
          engineering: { raw: session.engineeringRawScore, total: session.engineeringTotalQuestions, percentile: session.engineeringPercentile },
          reasoning: { raw: session.reasoningRawScore, total: session.reasoningTotalQuestions, percentile: session.reasoningPercentile },
          physics: { raw: session.physicsRawScore, total: session.physicsTotalQuestions, percentile: session.physicsPercentile },
        } : null,
        metadata: app.metadata as Record<string, unknown> | null,
      }
    })
  )

  // Sort by composite score descending
  scoredApplications.sort((a, b) => b.scores.compositeScore - a.scores.compositeScore)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-aerojet-blue uppercase dark:text-white">Shortlisting Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review and shortlist candidates using Criteria-style aptitude metrics, sub-scores, and percentile rankings.
          </p>
        </div>
      </div>

      <ShortlistingTable data={scoredApplications} />
    </div>
  )
}
