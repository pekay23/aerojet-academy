import { Metadata } from 'next'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import OJTDashboard from './_components/OJTDashboard'

export const metadata: Metadata = { title: 'OJT Logbooks | Staff' }
export const dynamic = 'force-dynamic'

export default async function OJTLogbooksPage() {
  await requireStaff()

  // Auto-provision OJT logbooks is now lazy - only runs when explicitly triggered
  // via the "Provision Missing" button in the dashboard or the /api/staff/ojt/provision endpoint
  // This avoids silent DB writes on every page load

  const [logbooks, statusCounts] = await Promise.all([
    prismaUnfiltered.oJTLogbook.findMany({
      include: {
        studentProfile: {
          select: {
            studentId: true,
            programmeChoice: true,
            user: {
              select: {
                email: true,
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        mentorAssignments: {
          where: { isPrimary: true },
          take: 1,
          select: { mentorId: true },
        },
        licenceCategory: { select: { code: true, name: true } },
        _count: { select: { entries: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prismaUnfiltered.oJTLogbook.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
  ])

  const statusMap: Record<string, number> = {}
  for (const s of statusCounts) {
    statusMap[s.status] = s._count.id
  }

  const serialised = logbooks.map((lb) => ({
    id: lb.id,
    studentName: lb.studentProfile.user.profile
      ? `${lb.studentProfile.user.profile.firstName ?? ''} ${lb.studentProfile.user.profile.lastName ?? ''}`.trim()
      : lb.studentProfile.user.email,
    studentId: lb.studentProfile.studentId,
    email: lb.studentProfile.user.email,
    programme: lb.studentProfile.programmeChoice ?? 'Unknown',
    licenceCategory: lb.licenceCategory.code,
    facilityName: lb.facilityName,
    facilityApprovalNo: lb.facilityApprovalNo,
    startDate: lb.startDate.toISOString(),
    targetEndDate: lb.targetEndDate?.toISOString() ?? null,
    totalLoggedHours: lb.totalLoggedHours,
    status: lb.status,
    entryCount: lb._count.entries,
    hasMentor: lb.mentorAssignments.length > 0,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-aerojet-blue text-2xl font-black tracking-tight sm:text-3xl dark:text-white">
          OJT Experience Logbooks
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          EASA Part-66 compliant digital experience logbooks for on-the-job training.
        </p>
      </div>

      <OJTDashboard logbooks={serialised} statusCounts={statusMap} />
    </div>
  )
}
