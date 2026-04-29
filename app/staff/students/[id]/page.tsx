import { getAuthSession } from '@/lib/auth/helpers'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Metadata } from 'next'
import { serializePrisma } from '@/lib/utils/serialization'
import StudentDetailTabs from './_components/StudentDetailTabs'
import EditProfileDialog from '@/app/staff/users/[id]/_components/EditProfileDialog'
import EditProfilePhotoDialog from '@/app/staff/users/[id]/_components/EditProfilePhotoDialog'
import { compareNatural } from '@/lib/utils/natural-sort'

export const metadata: Metadata = { title: 'Student Details | Staff Portal' }
export const dynamic = 'force-dynamic'

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
    where: { id, role: { in: ['STUDENT', 'APPLICANT'] } },
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
        where: { deletedAt: null },
        include: {
          examAttendance: true,
          sittingAssignments: {
            where: { status: { in: ['ASSIGNED', 'CONFIRMED', 'ATTENDED', 'ABSENT', 'EXCUSED'] } },
            include: { sitting: true },
            orderBy: { assignedAt: 'desc' },
          },
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
      payments: {
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
    .sort((a, b) => compareNatural(a.code || '', b.code || ''))

  // Resolve staff names for transactions and payments
  const staffIds = new Set<string>()
  walletTransactions.forEach((t) => t.createdBy && staffIds.add(t.createdBy))
  student.payments?.forEach((p) => p.approvedBy && staffIds.add(p.approvedBy))

  const staffUsers =
    staffIds.size > 0
      ? await prisma.user.findMany({
          where: { id: { in: Array.from(staffIds) } },
          select: { id: true, profile: { select: { firstName: true, lastName: true } } },
        })
      : []

  const staffMap = Object.fromEntries(
    staffUsers.map((u) => [
      u.id,
      u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : 'Staff',
    ])
  )

  const enrichedWalletTransactions = walletTransactions.map((t) => ({
    ...t,
    staffName: t.createdBy ? staffMap[t.createdBy] : null,
  }))

  const enrichedPayments = student.payments?.map((p) => ({
    ...p,
    staffName: p.approvedBy ? staffMap[p.approvedBy] : null,
  })) || []

  // Serialize data for client components
  const serializedStudent = serializePrisma({
    ...student,
    password: undefined,
    walletTransactions: enrichedWalletTransactions,
    payments: enrichedPayments,
    fullTimeEnrollments,
    modularEnrollments,
  })

  const serializedExamComponents = serializePrisma(examComponents)
  const serializedUpcomingEvents = serializePrisma(upcomingEvents)
  const serializedAcademicYears = serializePrisma(academicYears)
  const serializedSemesters = serializePrisma(semesters)
  const serializedStudyPathways = serializePrisma(studyPathways)

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

        <div className="flex items-start gap-5">
          <div className="relative">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-aerojet-blue text-2xl font-black text-white shadow-lg">
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
            <EditProfilePhotoDialog
              userId={student.id}
              currentPhotoUrl={student.profile?.profilePhotoUrl ?? null}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-800 dark:text-white">{fullName}</h1>
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
            </div>
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
                <span className="rounded-full bg-aerojet-blue/10 px-2.5 py-0.5 text-[10px] font-black text-aerojet-blue uppercase">
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
        examComponents={serializedExamComponents}
        upcomingEvents={serializedUpcomingEvents}
        academicYears={serializedAcademicYears}
        semesters={serializedSemesters}
        studyPathways={serializedStudyPathways}
        initialTab={tab || 'profile'}
        staffId={session.user.id}
        staffRole={session.user.role}
      />
    </div>
  )
}
