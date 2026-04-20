import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import { format } from 'date-fns'
import { ScrollText, User, Tag, Clock } from 'lucide-react'
import { serializePrisma } from '@/lib/utils/serialization'
import AuditLogTable from './_components/AuditLogTable'
import { queryAuditLogs } from '@/lib/audit/logger'

export default async function AuditLogsPage(req: {
  searchParams: { page?: string }
}) {
  const session = await getAuthSession()
  if (!session || (session.user.role !== 'STAFF' && session.user.role !== 'ADMIN')) {
    redirect('/login')
  }

  const searchParams = req.searchParams || {}
  const page = parseInt(searchParams.page as string) || 1
  const limit = 25

  const { logs, total } = await queryAuditLogs({
    limit,
    offset: (page - 1) * limit,
  })

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

  if (userIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { profile: true },
    })
    users.forEach(
      (u) =>
        (entityLabels[u.id] = u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u.email)
    )
  }
  if (courseIds.length > 0) {
    const courses = await prisma.course.findMany({ where: { id: { in: courseIds } } })
    courses.forEach((c) => (entityLabels[c.id] = c.name))
  }
  if (examEventIds.length > 0) {
    const events = await prisma.examEvent.findMany({ where: { id: { in: examEventIds } } })
    events.forEach((e) => (entityLabels[e.id] = e.name))
  }
  if (examPoolIds.length > 0) {
    const pools = await prisma.examPool.findMany({ where: { id: { in: examPoolIds } } })
    pools.forEach((p) => (entityLabels[p.id] = p.name))
  }
  if (examComponentIds.length > 0) {
    const comps = await prisma.examComponent.findMany({ where: { id: { in: examComponentIds } } })
    comps.forEach((c) => (entityLabels[c.id] = c.name))
  }
  if (classIds.length > 0) {
    const classes = await prisma.class.findMany({ where: { id: { in: classIds } } })
    classes.forEach((c) => (entityLabels[c.id] = c.name))
  }
  if (paymentIds.length > 0) {
    const payments = await prisma.payment.findMany({ where: { id: { in: paymentIds } } })
    payments.forEach(
      (p) => (entityLabels[p.id] = p.referenceCode || `Payment #${p.id.substring(0, 6)}`)
    )
  }
  if (studentProfileIds.length > 0) {
    const profiles = await prisma.studentProfile.findMany({
      where: { id: { in: studentProfileIds } },
    })
    profiles.forEach((p) => (entityLabels[p.id] = `Student ID: ${p.studentId}`))
  }
  if (enrollmentIds.length > 0) {
    const enrollments = await prisma.enrollment.findMany({
      where: { id: { in: enrollmentIds } },
      include: { course: true, user: { include: { profile: true } } },
    })
    enrollments.forEach((e) => {
      const name = e.user.profile
        ? `${e.user.profile.firstName} ${e.user.profile.lastName}`
        : e.user.email
      entityLabels[e.id] = `${name} - ${e.course.name}`
    })
  }

  return (
    <div className="mx-auto max-w-[1800px] space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-aerojet-blue sm:text-3xl dark:text-white">
          System Audit Logs
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Track all administrative actions, overrides, and critical system changes.
        </p>
      </div>

      <AuditLogTable logs={serializePrisma(logs)} total={total} entityLabels={entityLabels} />
    </div>
  )
}
