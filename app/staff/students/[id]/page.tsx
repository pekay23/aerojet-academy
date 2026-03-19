import { getAuthSession } from '@/lib/auth/helpers'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Metadata } from 'next'
import StudentDetailTabs from './_components/StudentDetailTabs'
import EditProfileDialog from '@/app/staff/users/[id]/_components/EditProfileDialog'

export const metadata: Metadata = { title: 'Student Details | Staff Portal' }

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function StudentManagementPage({ params, searchParams }: Props) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { id } = await params
  const { tab } = await searchParams

  // Fetch comprehensive student data
  const student = await prisma.user.findUnique({
    where: { id, role: 'STUDENT' },
    include: {
      profile: true,
      studentProfile: {
        include: {
          academicYear: { select: { id: true, name: true } },
          semester: { select: { id: true, name: true } },
          pathwayRel: { select: { id: true, code: true, name: true } },
          licenseTargets: {
            include: { licenseCategory: { select: { id: true, code: true, name: true } } },
          },
        },
      },
      wallet: true,
      enrollments: {
        include: {
          course: true,
          grades: { orderBy: { assessmentDate: 'desc' } },
        },
      },
      examResults: {
        include: {
          exam: {
            include: {
              examComponent: { include: { course: { select: { name: true, code: true } } } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      examBookings: {
        include: {
          exam: {
            include: {
              examComponent: { include: { course: { select: { name: true, code: true } } } },
            },
          },
          event: { select: { id: true, name: true, startDate: true, endDate: true } },
          course: { select: { id: true, name: true, code: true } },
        },
        orderBy: { examDate: 'desc' },
      },
      examBundles: {
        orderBy: { createdAt: 'desc' },
      },
      attendanceRecords: {
        orderBy: { date: 'desc' },
        take: 100,
        include: {
          class: { select: { name: true, course: { select: { name: true, code: true } } } },
        },
      },
    },
  })

  if (!student) notFound()

  // Fetch wallet transactions separately for better control
  const walletTransactions = student.wallet
    ? await prisma.walletTransaction.findMany({
        where: { walletId: student.wallet.id },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
    : []

  // Fetch full-time enrollment / OJT data
  const fullTimeEnrollments = await prisma.fullTimeEnrollment.findMany({
    where: { studentId: id },
    include: {
      programme: { select: { code: true, name: true } },
      ojtPeriods: { orderBy: { startDate: 'desc' } },
      milestones: { orderBy: [{ yearNumber: 'asc' }, { createdAt: 'asc' }] },
    },
  })

  // Fetch modular enrollments
  const modularEnrollments = await prisma.modularEnrollment.findMany({
    where: { studentId: id },
    include: {
      package: { select: { id: true, name: true } },
    },
  })

  // Fetch available exam components and upcoming events for booking dialog
  const [examComponentsRaw, upcomingEvents, academicYears, semesters, studyPathways] =
    await Promise.all([
      prisma.examComponent.findMany({
        include: { course: { select: { id: true, name: true, code: true } } },
      }),
      prisma.examEvent.findMany({
        where: { status: { in: ['OPEN', 'DRAFT'] }, startDate: { gte: new Date() } },
        orderBy: { startDate: 'asc' },
      }),
      prisma.academicYear.findMany({ orderBy: { startDate: 'desc' } }),
      prisma.semester.findMany({ orderBy: { startDate: 'desc' } }),
      prisma.studyPathwayModel?.findMany?.() ?? [],
    ])

  // Natural sort by module code (M1, M2, M3... M10, M12 instead of M1, M10, M12)
  // and remove any duplicates by code (keep first occurrence)
  const seenCourse = new Set<string>()
  const examComponents = examComponentsRaw
    .filter((ec) => {
      const courseId = ec.courseId || ''
      if (seenCourse.has(courseId)) return false
      seenCourse.add(courseId)
      return true
    })
    .sort((a, b) => {
      // Extract numeric suffix from module code (e.g., "M01" -> 1, "M12" -> 12)
      const numA = parseInt((a.code || '').replace(/\D/g, '') || '0', 10)
      const numB = parseInt((b.code || '').replace(/\D/g, '') || '0', 10)
      // If both have numbers, sort numerically; otherwise alphabetically
      if (numA && numB) return numA - numB
      return (a.code || '').localeCompare(b.code || '')
    })

  // Serialize data for client components
  const serializedStudent = JSON.parse(
    JSON.stringify({
      ...student,
      password: undefined,
      walletTransactions,
      fullTimeEnrollments,
      modularEnrollments,
      examResults: student.examResults.map((r: any) => ({
        ...r,
        score: Number(r.score),
        percentage: Number(r.percentage),
      })),
      examBookings: student.examBookings.map((b: any) => ({
        ...b,
        score: b.score != null ? Number(b.score) : null,
        percentage: b.percentage != null ? Number(b.percentage) : null,
      })),
    })
  )

  const fullName = student.profile
    ? [student.profile.firstName, student.profile.middleName, student.profile.lastName]
        .filter(Boolean)
        .join(' ')
    : student.email

  const initials = student.profile
    ? `${student.profile.firstName?.[0]}${student.profile.lastName?.[0]}`
    : student.email[0].toUpperCase()

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/staff/users?tab=students"
          className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-slate-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Students
        </Link>

        <div className="flex items-center gap-5">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#002a5c] text-xl font-black text-white">
            {student.profile?.profilePhotoUrl ? (
              <img
                src={student.profile.profilePhotoUrl}
                alt={fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <EditProfileDialog
            userId={student.id}
            initialData={{
              firstName: student.profile?.firstName || '',
              middleName: student.profile?.middleName || '',
              lastName: student.profile?.lastName || '',
              email: student.email,
              personalEmail: student.personalEmail,
              phone: student.profile?.phone || '',
              nationality: student.profile?.nationality || '',
              dateOfBirth: student.profile?.dateOfBirth,
            }}
          />
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white">{fullName}</h1>
            <p className="mt-0.5 flex items-center gap-2 text-sm text-slate-400">
              <span className="font-mono">{student.studentProfile?.studentId ?? '—'}</span>
              {student.studentProfile?.pathwayRel && (
                <>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span>{student.studentProfile.pathwayRel.name}</span>
                </>
              )}
              {student.studentProfile?.academicYear && (
                <>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span>{student.studentProfile.academicYear.name}</span>
                </>
              )}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                  student.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-700'
                    : student.status === 'SUSPENDED'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                {student.status}
              </span>
              {student.studentProfile?.enrollmentType && (
                <span className="rounded-full bg-[#002a5c]/10 px-2.5 py-0.5 text-[10px] font-black text-[#002a5c] uppercase">
                  {student.studentProfile.enrollmentType.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs (client component) */}
      <StudentDetailTabs
        student={serializedStudent}
        examComponents={JSON.parse(JSON.stringify(examComponents))}
        upcomingEvents={JSON.parse(JSON.stringify(upcomingEvents))}
        academicYears={JSON.parse(JSON.stringify(academicYears))}
        semesters={JSON.parse(JSON.stringify(semesters))}
        studyPathways={JSON.parse(JSON.stringify(studyPathways))}
        initialTab={tab || 'profile'}
      />
    </div>
  )
}
