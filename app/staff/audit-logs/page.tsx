import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'

import { serializePrisma } from '@/lib/utils/serialization'
import { maskIp } from '@/lib/utils/string'
import AuditLogTable from './_components/AuditLogTable'
import { queryAuditLogs } from '@/lib/audit/logger'

export default async function AuditLogsPage(req: { searchParams: Promise<{ page?: string }> }) {
  const session = await getAuthSession()
  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
    return await redirectToLogin()
  }

  const searchParams = (await req.searchParams) || {}
  const page = parseInt(searchParams.page as string) || 1
  const limit = 25

  const { logs, total } = await queryAuditLogs({
    limit,
    offset: (page - 1) * limit,
  })
  const firstShown = total === 0 ? 0 : (page - 1) * limit + 1
  const lastShown = Math.min(page * limit, total)

  // Pre-fetch entity labels
  const entityLabels: Record<string, string> = {}

  const userIds = [
    ...new Set(
      logs
        .filter((l) => l.entity === 'User')
        .map((l) => l.entityId)
        .filter(Boolean)
    ),
  ] as string[]
  const courseIds = [
    ...new Set(
      logs
        .filter((l) => l.entity === 'Course')
        .map((l) => l.entityId)
        .filter(Boolean)
    ),
  ] as string[]
  const examEventIds = [
    ...new Set(
      logs
        .filter((l) => l.entity === 'ExamEvent')
        .map((l) => l.entityId)
        .filter(Boolean)
    ),
  ] as string[]
  const examPoolIds = [
    ...new Set(
      logs
        .filter((l) => l.entity === 'ExamPool')
        .map((l) => l.entityId)
        .filter(Boolean)
    ),
  ] as string[]
  const examComponentIds = [
    ...new Set(
      logs
        .filter((l) => l.entity === 'ExamComponent')
        .map((l) => l.entityId)
        .filter(Boolean)
    ),
  ] as string[]
  const classIds = [
    ...new Set(
      logs
        .filter((l) => l.entity === 'Class')
        .map((l) => l.entityId)
        .filter(Boolean)
    ),
  ] as string[]
  const paymentIds = [
    ...new Set(
      logs
        .filter((l) => l.entity === 'Payment')
        .map((l) => l.entityId)
        .filter(Boolean)
    ),
  ] as string[]
  const studentProfileIds = [
    ...new Set(
      logs
        .filter((l) => l.entity === 'StudentProfile')
        .map((l) => l.entityId)
        .filter(Boolean)
    ),
  ] as string[]
  const enrollmentIds = [
    ...new Set(
      logs
        .filter((l) => l.entity === 'Enrollment')
        .map((l) => l.entityId)
        .filter(Boolean)
    ),
  ] as string[]
  const examBookingIds = [
    ...new Set(
      logs
        .filter((l) => l.entity === 'ExamBooking')
        .map((l) => l.entityId)
        .filter(Boolean)
    ),
  ] as string[]
  const examResultIds = [
    ...new Set(
      logs
        .filter((l) => l.entity === 'ExamResult')
        .map((l) => l.entityId)
        .filter(Boolean)
    ),
  ] as string[]
  // 'users' (lowercase) is used by auth/2FA/login audit logs
  const usersLowercaseIds = [
    ...new Set(
      logs
        .filter((l) => l.entity === 'users')
        .map((l) => l.entityId)
        .filter(Boolean)
    ),
  ] as string[]
  const licenseCategoryIds = [
    ...new Set(
      logs
        .filter((l) => l.entity === 'LicenseCategory')
        .map((l) => l.entityId)
        .filter(Boolean)
    ),
  ] as string[]
  const licenseModuleReqIds = [
    ...new Set(
      logs
        .filter((l) => l.entity === 'LicenseModuleRequirement')
        .map((l) => l.entityId)
        .filter(Boolean)
    ),
  ] as string[]
  // OJT entity types
  const ojtLogbookIds = [
    ...new Set(
      logs
        .filter((l) => l.entity === 'OJTLogbook')
        .map((l) => l.entityId)
        .filter(Boolean)
    ),
  ] as string[]
  const ojtEntryIds = [
    ...new Set(
      logs
        .filter((l) => l.entity === 'OJTLogbookEntry')
        .map((l) => l.entityId)
        .filter(Boolean)
    ),
  ] as string[]
  const ojtMentorAssignmentIds = [
    ...new Set(
      logs
        .filter((l) => l.entity === 'OJTMentorAssignment')
        .map((l) => l.entityId)
        .filter(Boolean)
    ),
  ] as string[]

  // Fetch all entity labels in parallel instead of sequentially
  const [
    users,
    courses,
    events,
    pools,
    comps,
    classes,
    payments,
    profiles,
    enrollments,
    examBookings,
    examResults,
    usersLowercase,
    licenseCategories,
    licenseModuleReqs,
    ojtLogbooks,
    ojtEntries,
    ojtMentorAssignments,
  ] = await Promise.all([
    userIds.length > 0
      ? prismaUnfiltered.user.findMany({
          where: { id: { in: userIds } },
          include: { profile: true },
        })
      : Promise.resolve([]),
    courseIds.length > 0
      ? prismaUnfiltered.course.findMany({ where: { id: { in: courseIds } } })
      : Promise.resolve([]),
    examEventIds.length > 0
      ? prismaUnfiltered.examEvent.findMany({ where: { id: { in: examEventIds } } })
      : Promise.resolve([]),
    examPoolIds.length > 0
      ? prismaUnfiltered.examPool.findMany({ where: { id: { in: examPoolIds } } })
      : Promise.resolve([]),
    examComponentIds.length > 0
      ? prismaUnfiltered.examComponent.findMany({ where: { id: { in: examComponentIds } } })
      : Promise.resolve([]),
    classIds.length > 0
      ? prismaUnfiltered.class.findMany({ where: { id: { in: classIds } } })
      : Promise.resolve([]),
    paymentIds.length > 0
      ? prismaUnfiltered.payment.findMany({ where: { id: { in: paymentIds } } })
      : Promise.resolve([]),
    studentProfileIds.length > 0
      ? prismaUnfiltered.studentProfile.findMany({ where: { id: { in: studentProfileIds } } })
      : Promise.resolve([]),
    enrollmentIds.length > 0
      ? prismaUnfiltered.enrollment.findMany({
          where: { id: { in: enrollmentIds } },
          include: { course: true, user: { include: { profile: true } } },
        })
      : Promise.resolve([]),
    examBookingIds.length > 0
      ? prismaUnfiltered.examBooking.findMany({
          where: { id: { in: examBookingIds } },
          include: { user: { include: { profile: true } } },
        })
      : Promise.resolve([]),
    examResultIds.length > 0
      ? prismaUnfiltered.examResult.findMany({
          where: { id: { in: examResultIds } },
          include: { user: { include: { profile: true } } },
        })
      : Promise.resolve([]),
    usersLowercaseIds.length > 0
      ? prismaUnfiltered.user.findMany({
          where: { id: { in: usersLowercaseIds } },
          include: { profile: true },
        })
      : Promise.resolve([]),
    licenseCategoryIds.length > 0
      ? prismaUnfiltered.licenseCategory.findMany({ where: { id: { in: licenseCategoryIds } } })
      : Promise.resolve([]),
    licenseModuleReqIds.length > 0
      ? prismaUnfiltered.licenseModuleRequirement.findMany({
          where: { id: { in: licenseModuleReqIds } },
          include: {
            course: { select: { name: true, code: true } },
            licenseCategory: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
    ojtLogbookIds.length > 0
      ? prismaUnfiltered.oJTLogbook.findMany({
          where: { id: { in: ojtLogbookIds } },
          include: {
            studentProfile: {
              select: {
                studentId: true,
                user: {
                  select: { email: true, profile: { select: { firstName: true, lastName: true } } },
                },
              },
            },
            licenceCategory: { select: { code: true } },
          },
        })
      : Promise.resolve([]),
    ojtEntryIds.length > 0
      ? prismaUnfiltered.oJTLogbookEntry.findMany({
          where: { id: { in: ojtEntryIds } },
          include: {
            logbook: { select: { studentProfile: { select: { studentId: true } } } },
            ataChapter: { select: { code: true } },
          },
        })
      : Promise.resolve([]),
    ojtMentorAssignmentIds.length > 0
      ? prismaUnfiltered.oJTMentorAssignment.findMany({
          where: { id: { in: ojtMentorAssignmentIds } },
          include: { logbook: { select: { studentProfile: { select: { studentId: true } } } } },
        })
      : Promise.resolve([]),
  ])

  // Fetch mentor names for OJT mentor assignments
  const mentorIds = ojtMentorAssignments.map((m) => m.mentorId).filter(Boolean)
  const mentors =
    mentorIds.length > 0
      ? await prismaUnfiltered.user.findMany({
          where: { id: { in: mentorIds } },
          include: { profile: true },
        })
      : []
  const mentorNameMap = new Map(
    mentors.map((u) => [
      u.id,
      u.profile ? `${u.profile.firstName ?? ''} ${u.profile.lastName ?? ''}`.trim() : u.email,
    ])
  )

  users.forEach(
    (u) =>
      (entityLabels[u.id] = u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u.email)
  )
  courses.forEach((c) => (entityLabels[c.id] = c.name))
  events.forEach((e) => (entityLabels[e.id] = e.name))
  pools.forEach((p) => (entityLabels[p.id] = p.name))
  comps.forEach((c) => (entityLabels[c.id] = c.name))
  classes.forEach((c) => (entityLabels[c.id] = c.name))
  payments.forEach(
    (p) => (entityLabels[p.id] = p.referenceCode || `Payment #${p.id.substring(0, 6)}`)
  )
  profiles.forEach((p) => (entityLabels[p.id] = `Student ID: ${p.studentId}`))
  enrollments.forEach((e) => {
    const name = e.user.profile
      ? `${e.user.profile.firstName} ${e.user.profile.lastName}`
      : e.user.email
    entityLabels[e.id] = `${name} — ${e.course.name}`
  })
  examBookings.forEach((b) => {
    const name = b.user?.profile
      ? `${b.user.profile.firstName} ${b.user.profile.lastName}`
      : b.user?.email || 'Unknown'
    entityLabels[b.id] = `${name} — ${b.moduleCode || 'Exam'}`
  })
  examResults.forEach((r) => {
    const name = r.user?.profile
      ? `${r.user.profile.firstName} ${r.user.profile.lastName}`
      : r.user?.email || 'Unknown'
    entityLabels[r.id] = `${name} — ${r.moduleCode || 'Result'}`
  })
  usersLowercase.forEach(
    (u) =>
      (entityLabels[u.id] = u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u.email)
  )
  licenseCategories.forEach((lc) => (entityLabels[lc.id] = lc.name))
  licenseModuleReqs.forEach((lmr) => {
    const courseName = lmr.course?.code || lmr.course?.name || 'Module'
    const catName = lmr.licenseCategory?.name || ''
    entityLabels[lmr.id] = `${courseName}${catName ? ` — ${catName}` : ''}`
  })
  ojtLogbooks.forEach((lb) => {
    const studentName = lb.studentProfile.user.profile
      ? `${lb.studentProfile.user.profile.firstName ?? ''} ${lb.studentProfile.user.profile.lastName ?? ''}`.trim()
      : lb.studentProfile.user.email
    entityLabels[lb.id] =
      `${studentName} (${lb.studentProfile.studentId}) — ${lb.licenceCategory?.code || 'Unknown'}`
  })
  ojtEntries.forEach((e) => {
    const studentId = e.logbook?.studentProfile?.studentId || 'Unknown'
    const ataCode = e.ataChapter?.code || 'Unknown'
    entityLabels[e.id] = `Entry: ${studentId} — ATA ${ataCode}`
  })
  ojtMentorAssignments.forEach((m) => {
    const studentId = m.logbook?.studentProfile?.studentId || 'Unknown'
    const mentorName = mentorNameMap.get(m.mentorId) || 'Unknown'
    entityLabels[m.id] =
      `Mentor Assignment: ${studentId} — Mentor: ${mentorName} (Primary: ${m.isPrimary})`
  })

  return (
    <div className="mx-auto max-w-450 space-y-6">
      <div>
        <h1 className="text-aerojet-blue text-2xl font-black tracking-tight sm:text-3xl dark:text-white">
          System Audit Logs
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Track all administrative actions, overrides, and critical system changes. Showing{' '}
          {firstShown}-{lastShown} of {total} total entries.
        </p>
      </div>

      <AuditLogTable
        logs={serializePrisma(logs.map((l) => ({ ...l, ipAddress: maskIp(l.ipAddress) })))}
        total={total}
        entityLabels={entityLabels}
      />
    </div>
  )
}
