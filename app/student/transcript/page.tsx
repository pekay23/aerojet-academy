import { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { calculateAttendancePercentage } from '@/lib/attendance'
import { getLicenseProgress } from '@/lib/license/progress'
import PrintButton from './PrintButton'

export const metadata: Metadata = {
  title: 'Academic Transcript | Student Portal',
  description: 'Your Academy-issued academic record.',
}

export default async function TranscriptPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const [profile, enrollments, results, attendance, licenseProgress] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        studentId: true,
        enrollmentType: true,
        enrollmentDate: true,
        graduationDate: true,
        currentYearNumber: true,
        currentSemesterNumber: true,
        user: { select: { profile: { select: { firstName: true, lastName: true } }, email: true } },
        pathwayRel: { select: { name: true } },
      },
    }),
    prisma.enrollment.findMany({
      where: { userId: session.user.id },
      select: {
        status: true,
        completedAt: true,
        course: { select: { code: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.examResult.findMany({
      where: { userId: session.user.id },
      select: {
        moduleCode: true,
        percentage: true,
        passed: true,
        examCategory: true,
        attemptType: true,
        createdAt: true,
        exam: { select: { examDate: true, examComponent: { select: { course: { select: { code: true, name: true } } } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    calculateAttendancePercentage(session.user.id),
    getLicenseProgress(session.user.id),
  ])

  const fullName = profile?.user.profile
    ? `${profile.user.profile.firstName} ${profile.user.profile.lastName}`
    : (profile?.user.email ?? 'Student')

  const moduleName = (r: (typeof results)[number]) =>
    r.exam?.examComponent?.course?.name ?? r.moduleCode ?? '—'
  const moduleCode = (r: (typeof results)[number]) =>
    r.exam?.examComponent?.course?.code ?? r.moduleCode ?? '—'

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white print:text-2xl">
            Academic Transcript
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Academy-issued record. This is not an official EASA certificate. No grade-point
            average is computed — this is an EASA Part-147 training record.
          </p>
        </div>
        <PrintButton />
      </div>

      {/* Identity */}
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-white p-5 text-sm sm:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
        <Field label="Name" value={fullName} />
        <Field label="Student ID" value={profile?.studentId ?? '—'} />
        <Field label="Pathway" value={profile?.pathwayRel?.name ?? profile?.enrollmentType ?? '—'} />
        <Field
          label="Current Term"
          value={`Year ${profile?.currentYearNumber ?? 1}, Sem ${profile?.currentSemesterNumber ?? 1}`}
        />
        <Field
          label="Enrolled"
          value={profile?.enrollmentDate?.toLocaleDateString('en-GB') ?? '—'}
        />
        <Field
          label="Graduated"
          value={profile?.graduationDate?.toLocaleDateString('en-GB') ?? '—'}
        />
        <Field
          label="Attendance"
          value={attendance.total > 0 ? `${attendance.percentage}%` : 'N/A'}
        />
      </div>

      {/* Exam results */}
      <Section title="Examination Record">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left dark:border-slate-800">
              <th className="px-3 py-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">Module</th>
              <th className="px-3 py-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">Category</th>
              <th className="px-3 py-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">Attempt</th>
              <th className="px-3 py-2 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">Score</th>
              <th className="px-3 py-2 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">Result</th>
              <th className="px-3 py-2 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {results.map((r, i) => (
              <tr key={i}>
                <td className="px-3 py-2">
                  <span className="font-mono font-bold">{moduleCode(r)}</span>{' '}
                  <span className="text-slate-500">{moduleName(r)}</span>
                </td>
                <td className="px-3 py-2 text-xs text-slate-500">
                  {r.examCategory === 'INTERNAL' ? 'Internal' : 'Official EASA'}
                </td>
                <td className="px-3 py-2 text-xs text-slate-500">
                  {(r.attemptType || 'FIRST').replace(/_/g, ' ')}
                </td>
                <td className="px-3 py-2 text-center font-mono">
                  {r.percentage != null ? `${r.percentage}%` : '—'}
                </td>
                <td className="px-3 py-2 text-center">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                      r.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {r.passed ? 'Pass' : 'Fail'}
                  </span>
                </td>
                <td className="px-3 py-2 text-center text-xs text-slate-500">
                  {(r.exam?.examDate ?? r.createdAt).toLocaleDateString('en-GB')}
                </td>
              </tr>
            ))}
            {results.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-400">
                  No exam records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>

      {/* Course enrollments */}
      <Section title="Course Enrolment Record">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left dark:border-slate-800">
              <th className="px-3 py-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">Course</th>
              <th className="px-3 py-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">Status</th>
              <th className="px-3 py-2 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">Completed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {enrollments.map((e, i) => (
              <tr key={i}>
                <td className="px-3 py-2">
                  <span className="font-mono font-bold">{e.course.code}</span>{' '}
                  <span className="text-slate-500">{e.course.name}</span>
                </td>
                <td className="px-3 py-2 text-xs">{e.status}</td>
                <td className="px-3 py-2 text-center text-xs text-slate-500">
                  {e.completedAt?.toLocaleDateString('en-GB') ?? '—'}
                </td>
              </tr>
            ))}
            {enrollments.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-sm text-slate-400">
                  No course enrolments.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>

      {licenseProgress.length > 0 && (
        <Section title="License Progress">
          <div className="space-y-2">
            {licenseProgress.map((lp) => (
              <div key={lp.licenseCategoryId} className="flex items-center justify-between text-sm">
                <span className="font-bold">
                  {lp.code} — {lp.name}
                </span>
                <span className="text-slate-500">
                  {lp.passedCount}/{lp.totalRequired} modules ({lp.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      <p className="text-xs text-slate-400 print:mt-6">
        Generated {new Date().toLocaleString('en-GB')} · Aerojet Aviation Academy (EASA Part-147)
      </p>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{label}</p>
      <p className="font-medium text-slate-800 dark:text-slate-200">{value}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 text-xs font-black tracking-widest text-slate-400 uppercase">{title}</h2>
      {children}
    </div>
  )
}
