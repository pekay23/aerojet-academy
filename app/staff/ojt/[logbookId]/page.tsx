import { Metadata } from 'next'
import { requireStaff, getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { notFound } from 'next/navigation'
import LogbookDetail from './_components/LogbookDetail'

export const metadata: Metadata = { title: 'OJT Logbook Detail | Staff' }
export const dynamic = 'force-dynamic'

export default async function LogbookDetailPage({
  params,
}: {
  params: Promise<{ logbookId: string }>
}) {
  await requireStaff()
  const { logbookId } = await params
  const session = await getAuthSession()

  const [logbook, ataChapters, staffMembers] = await Promise.all([
    prismaUnfiltered.oJTLogbook.findUnique({
      where: { id: logbookId },
      include: {
        studentProfile: {
          select: {
            studentId: true,
            programmeChoice: true,
            userId: true,
            user: {
              select: {
                email: true,
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        mentorAssignments: {
          include: {
            logbook: false,
          },
        },
        entries: {
          include: {
            ataChapter: { select: { id: true, code: true, title: true, category: true } },
          },
          orderBy: { date: 'desc' },
        },
      },
    }),
    prismaUnfiltered.aTAChapter.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, code: true, title: true, category: true },
    }),
    prismaUnfiltered.user.findMany({
      where: { role: { in: ['ADMIN', 'STAFF', 'INSTRUCTOR'] } },
      select: {
        id: true,
        email: true,
        profile: { select: { firstName: true, lastName: true } },
      },
      take: 100,
    }),
  ])

  if (!logbook) return notFound()

  // Calculate analytics
  const totalHours = logbook.entries.reduce((s, e) => s + e.durationHours, 0)
  const hoursByType: Record<string, number> = {}
  for (const e of logbook.entries) {
    hoursByType[e.maintenanceType] = (hoursByType[e.maintenanceType] || 0) + e.durationHours
  }
  const coveredChapters = new Set(logbook.entries.map((e) => e.ataChapterId))
  const signedCount = logbook.entries.filter(
    (e) => e.supervisorSignature && e.studentSignature
  ).length
  const startDate = logbook.startDate
  const monthsExperience = Math.floor(
    (Date.now() - startDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000)
  )

  const studentName = logbook.studentProfile.user.profile
    ? `${logbook.studentProfile.user.profile.firstName ?? ''} ${logbook.studentProfile.user.profile.lastName ?? ''}`.trim()
    : logbook.studentProfile.user.email

  const serialised = {
    id: logbook.id,
    studentName,
    studentId: logbook.studentProfile.studentId,
    email: logbook.studentProfile.user.email,
    programme: logbook.studentProfile.programmeChoice ?? 'Unknown',
    licenceCategory: logbook.licenceCategory,
    facilityName: logbook.facilityName,
    facilityApprovalNo: logbook.facilityApprovalNo,
    startDate: logbook.startDate.toISOString(),
    targetEndDate: logbook.targetEndDate?.toISOString() ?? null,
    totalLoggedHours: logbook.totalLoggedHours,
    status: logbook.status,
    entries: logbook.entries.map((e) => ({
      id: e.id,
      date: e.date.toISOString(),
      aircraftType: e.aircraftType,
      aircraftRegistration: e.aircraftRegistration,
      ataChapterId: e.ataChapter.id,
      ataChapter: e.ataChapter,
      taskDescription: e.taskDescription,
      workOrderReference: e.workOrderReference,
      maintenanceManualRef: e.maintenanceManualRef,
      maintenanceType: e.maintenanceType,
      durationHours: e.durationHours,
      supervisorId: e.supervisorId,
      supervisorSignature: e.supervisorSignature,
      studentSignature: e.studentSignature,
      verifiedByManagement: e.verifiedByManagement,
      licenceCategory: e.licenceCategory,
      workEnvironment: e.workEnvironment,
      toolsUsed: e.toolsUsed,
      partNumbersUsed: e.partNumbersUsed,
      safetyPrecautions: e.safetyPrecautions,
      competencyRating: e.competencyRating,
    })),
    analytics: {
      monthsExperience,
      totalHours: Math.round(totalHours * 10) / 10,
      hoursByType: Object.fromEntries(
        Object.entries(hoursByType).map(([k, v]) => [k, Math.round(v * 10) / 10])
      ),
      ataChaptersCovered: coveredChapters.size,
      totalATAChapters: ataChapters.length,
      signedEntries: signedCount,
      unsignedEntries: logbook.entries.length - signedCount,
    },
    mentorAssignments: logbook.mentorAssignments.map((m) => ({
      id: m.id,
      mentorId: m.mentorId,
      assignedDate: m.assignedDate.toISOString(),
      endDate: m.endDate?.toISOString() ?? null,
      isPrimary: m.isPrimary,
      notes: m.notes,
    })),
  }

  const ataOptions = ataChapters.map((ch) => ({
    id: ch.id,
    label: `${ch.code} — ${ch.title}`,
    category: ch.category,
  }))

  const supervisorOptions = staffMembers.map((s) => ({
    id: s.id,
    label: s.profile
      ? `${s.profile.firstName ?? ''} ${s.profile.lastName ?? ''}`.trim() || s.email
      : s.email,
  }))

  return (
    <LogbookDetail
      logbook={serialised}
      ataChapters={ataOptions}
      supervisors={supervisorOptions}
      staffId={logbook.studentProfile.userId}
      mentorAssignments={serialised.mentorAssignments}
    />
  )
}
