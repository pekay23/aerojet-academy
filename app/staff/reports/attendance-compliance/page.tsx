import { Metadata } from 'next'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getAttendanceThreshold } from '@/lib/attendance'
import { Download, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

export const metadata: Metadata = { title: 'Attendance Compliance | Staff' }

export const dynamic = 'force-dynamic'

export default async function AttendanceCompliancePage({
  searchParams,
}: {
  searchParams: { courseId?: string; moduleCode?: string }
}) {
  await requireStaff()

  const courses = await prismaUnfiltered.course.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true },
    orderBy: { code: 'asc' },
  })

  const { effective: threshold } = await getAttendanceThreshold()

  const courseId = searchParams.courseId
  const moduleCode = searchParams.moduleCode

  const enrollments = await prismaUnfiltered.enrollment.findMany({
    where: {
      status: { in: ['ENROLLED', 'ACTIVE', 'APPROVED'] },
      ...(courseId ? { courseId } : {}),
      ...(moduleCode ? { course: { code: moduleCode } } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true } },
          studentProfile: { select: { studentId: true } },
        },
      },
      course: { select: { code: true, name: true } },
    },
  })

  type EnrollmentWithUser = (typeof enrollments)[number]
  type AttendanceRecordWithClass = (typeof records)[number]

  const studentIds = enrollments.map((e: EnrollmentWithUser) => e.user.id)

  const records = await prismaUnfiltered.attendanceRecord.findMany({
    where: { userId: { in: studentIds } },
    include: {
      class: { select: { id: true, name: true, courseId: true } },
    },
  })

  const recordsByUser = new Map<string, AttendanceRecordWithClass[]>()
  for (const r of records) {
    const list = recordsByUser.get(r.userId) || []
    list.push(r)
    recordsByUser.set(r.userId, list)
  }

  const report = enrollments.map((e: EnrollmentWithUser) => {
    const userRecords = recordsByUser.get(e.user.id) || []
    const courseRecords = userRecords.filter((r) => r.class.courseId === e.courseId)
    const total = courseRecords.length
    const present = courseRecords.filter(
      (r) => r.status === 'PRESENT' || r.status === 'LATE'
    ).length
    const rate = total > 0 ? Math.round((present / total) * 100) : 0
    const complianceStatus =
      rate >= threshold ? 'COMPLIANT' : rate >= threshold - 5 ? 'AT_RISK' : 'NON_COMPLIANT'

    return {
      studentId: e.user.studentProfile?.studentId,
      name:
        `${e.user.profile?.firstName || ''} ${e.user.profile?.lastName || ''}`.trim() ||
        e.user.email,
      email: e.user.email,
      moduleCode: e.course.code,
      moduleName: e.course.name,
      total,
      present,
      rate,
      complianceStatus,
    }
  })

  const compliant = report.filter((r) => r.complianceStatus === 'COMPLIANT').length
  const atRisk = report.filter((r) => r.complianceStatus === 'AT_RISK').length
  const nonCompliant = report.filter((r) => r.complianceStatus === 'NON_COMPLIANT').length

  const exportUrl = `/api/staff/attendance/compliance?${new URLSearchParams({
    ...(courseId ? { courseId } : {}),
    ...(moduleCode ? { moduleCode } : {}),
    format: 'csv',
  })}`

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-aerojet-blue text-2xl font-black uppercase sm:text-3xl dark:text-white">
            Attendance Compliance Report
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Per-student per-module attendance compliance. Threshold: {threshold}%.
          </p>
        </div>
        <a
          href={exportUrl}
          className="bg-aerojet-blue hover:bg-aerojet-blue/90 dark:bg-aerojet-sky inline-flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-white"
        >
          <Download className="h-5 w-5" />
          Export CSV
        </a>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-2xl font-black text-slate-900 dark:text-white">{report.length}</p>
          <p className="text-xs text-slate-500">Total Records</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center dark:border-green-800/50 dark:bg-green-900/10">
          <CheckCircle2 className="mx-auto h-5 w-5 text-green-600" />
          <p className="mt-1 text-2xl font-black text-green-800 dark:text-green-200">{compliant}</p>
          <p className="text-xs text-green-600">Compliant</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-800/50 dark:bg-amber-900/10">
          <AlertTriangle className="mx-auto h-5 w-5 text-amber-600" />
          <p className="mt-1 text-2xl font-black text-amber-800 dark:text-amber-200">{atRisk}</p>
          <p className="text-xs text-amber-600">At Risk</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center dark:border-red-800/50 dark:bg-red-900/10">
          <XCircle className="mx-auto h-5 w-5 text-red-600" />
          <p className="mt-1 text-2xl font-black text-red-800 dark:text-red-200">{nonCompliant}</p>
          <p className="text-xs text-red-600">Non-Compliant</p>
        </div>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-4" method="get">
        <div className="min-w-50 flex-1">
          <label className="mb-1 block text-xs font-bold text-slate-500">Module</label>
          <select
            name="moduleCode"
            defaultValue={moduleCode || ''}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">All Modules</option>
            {courses.map((c) => (
              <option key={c.id} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
          >
            Filter
          </button>
        </div>
      </form>

      {/* Report Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Module</th>
                <th className="px-6 py-4 text-center">Total</th>
                <th className="px-6 py-4 text-center">Present</th>
                <th className="px-6 py-4 text-right">Rate</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {report.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400 italic">
                    No attendance data available.
                  </td>
                </tr>
              ) : (
                report.map((r) => (
                  <tr
                    key={`${r.studentId}-${r.moduleCode}`}
                    className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{r.name}</p>
                        <p className="text-xs text-slate-500">{r.studentId || r.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">
                        {r.moduleCode}
                      </span>
                      <p className="text-xs text-slate-500">{r.moduleName}</p>
                    </td>
                    <td className="px-6 py-4 text-center font-bold">{r.total}</td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">
                      {r.present}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`text-sm font-black ${r.rate >= threshold ? 'text-emerald-600' : 'text-red-600'}`}
                      >
                        {r.rate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase ${
                          r.complianceStatus === 'COMPLIANT'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : r.complianceStatus === 'AT_RISK'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        }`}
                      >
                        {r.complianceStatus.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
