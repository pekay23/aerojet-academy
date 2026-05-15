import { Metadata } from 'next'
import { requireAuth } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import StudentLogbook from './_components/StudentLogbook'

export const metadata: Metadata = { title: 'OJT Logbook | Student' }
export const dynamic = 'force-dynamic'

export default async function StudentOJTPage() {
  const user = await requireAuth()

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    include: {
      licenseTargets: {
        include: { licenseCategory: true },
      },
    },
  })

  if (!studentProfile) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-500">Student profile not found.</p>
      </div>
    )
  }

  let logbook = await prisma.oJTLogbook.findUnique({
    where: { studentProfileId: studentProfile.id },
    include: {
      entries: {
        include: { ataChapter: { select: { code: true, title: true, category: true } } },
        orderBy: { date: 'desc' },
      },
      mentorAssignments: {
        where: { isPrimary: true },
        take: 1,
      },
    },
  })

  // If missing and they are in the OJT programme (FULL_TIME_4YEAR), auto-create it now!
  if (!logbook && studentProfile.programmeChoice === 'FULL_TIME_4YEAR') {
    const defaultCat = studentProfile.licenseTargets[0]?.licenseCategory?.code || 'B1.1'
    logbook = await prisma.oJTLogbook.create({
      data: {
        studentProfileId: studentProfile.id,
        licenceCategory: defaultCat,
        facilityName: 'Aerojet Academy',
        startDate: new Date(),
        status: 'ACTIVE',
      },
      include: {
        entries: {
          include: { ataChapter: { select: { code: true, title: true, category: true } } },
          orderBy: { date: 'desc' },
        },
        mentorAssignments: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    })
  }

  if (!logbook) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            OJT Experience Logbook
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Your digital experience logbook for on-the-job training.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-slate-500">
            Your OJT logbook has not been created yet. Please contact staff to set up your experience logbook.
          </p>
        </div>
      </div>
    )
  }

  // Calculate analytics
  const totalHours = logbook.entries.reduce((s, e) => s + e.durationHours, 0)
  const hoursByType: Record<string, number> = {}
  for (const e of logbook.entries) {
    hoursByType[e.maintenanceType] = (hoursByType[e.maintenanceType] || 0) + e.durationHours
  }
  const coveredChapters = new Set(logbook.entries.map((e) => e.ataChapterId))
  const signedCount = logbook.entries.filter((e) => e.supervisorSignature && e.studentSignature).length

  const serialised = {
    id: logbook.id,
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
      ataChapter: e.ataChapter,
      taskDescription: e.taskDescription,
      workOrderReference: e.workOrderReference,
      maintenanceManualRef: e.maintenanceManualRef,
      maintenanceType: e.maintenanceType,
      durationHours: e.durationHours,
      supervisorSignature: e.supervisorSignature,
      studentSignature: e.studentSignature,
      verifiedByManagement: e.verifiedByManagement,
      licenceCategory: e.licenceCategory,
      workEnvironment: e.workEnvironment,
      toolsUsed: e.toolsUsed,
      competencyRating: e.competencyRating,
    })),
    analytics: {
      totalHours: Math.round(totalHours * 10) / 10,
      hoursByType: Object.fromEntries(
        Object.entries(hoursByType).map(([k, v]) => [k, Math.round(v * 10) / 10])
      ),
      ataChaptersCovered: coveredChapters.size,
      signedEntries: signedCount,
      unsignedEntries: logbook.entries.length - signedCount,
    },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          OJT Experience Logbook
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          CAP 741 / EASA Part-66 digital experience logbook — {logbook.facilityName}
        </p>
      </div>

      <StudentLogbook data={serialised} />
    </div>
  )
}
