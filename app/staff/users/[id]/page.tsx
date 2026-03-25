import { getAuthSession } from '@/lib/auth/helpers'
import { redirect, notFound } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Mail, Phone, Globe, Calendar, User as UserIcon, Shield } from 'lucide-react'
import UserActionsMenu from '../../_components/UserActionsMenu'
import EditIdDialog from './_components/EditIdDialog'
import EditProfileDialog from './_components/EditProfileDialog'
import EditProfilePhotoDialog from './_components/EditProfilePhotoDialog'
import EditPathwayDialog from './_components/EditPathwayDialog'
import EditAcademicPeriodDialog from './_components/EditAcademicPeriodDialog'
import OjtSection from './_components/OjtSection'
import AcademicHistorySection from './_components/AcademicHistorySection'
import { Metadata } from 'next'

export const metadata: Metadata = { title: 'User Details | Staff Portal' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function UserProfilePage({ params }: Props) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      studentProfile: {
        include: {
          academicYear: { select: { id: true, name: true } },
          semester: { select: { id: true, name: true } },
          pathwayRel: { select: { code: true, name: true } },
        },
      },
      instructorProfile: true,
      staffProfile: true,
      enrollments: {
        include: {
          course: { select: { code: true, name: true } },
          academicYear: { select: { name: true } },
          semester: { select: { name: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      examBookings: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          moduleCode: true,
          result: true,
          score: true,
          percentage: true,
          attemptType: true,
          sourceNotes: true,
          examDate: true,
          status: true,
        },
      },
    },
  })

  if (!user) notFound()

  // Fetch OJT data for students with full-time enrollments
  const ftEnrollments =
    user.role === 'STUDENT'
      ? await prisma.fullTimeEnrollment.findMany({
          where: { studentId: user.id },
          include: {
            programme: { select: { code: true, name: true } },
            ojtPeriods: { orderBy: { startDate: 'desc' } },
          },
        })
      : []

  const ojtData = ftEnrollments.map((e) => ({
    id: e.id,
    programme: e.programme,
    ojtPeriods: e.ojtPeriods.map((o) => ({
      ...o,
      startDate: o.startDate.toISOString(),
      endDate: o.endDate?.toISOString() ?? null,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    })),
  }))

  const profile = user.profile
  const fullName = profile
    ? [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ')
    : user.email

  const initials = profile
    ? `${profile.firstName[0]}${profile.lastName[0]}`
    : user.email[0].toUpperCase()

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    PENDING: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    SUSPENDED: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    DEFERRED: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    ARCHIVED: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
    DEACTIVATED: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
  }

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    ADMIN: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    STAFF: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    INSTRUCTOR: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    STUDENT: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    APPLICANT: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/staff/users"
          className="mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-bold text-slate-400 transition-all duration-150 ease-out hover:bg-slate-100 hover:text-aerojet-blue dark:hover:bg-slate-800/60 dark:text-slate-500 dark:hover:text-blue-400"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Users
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-aerojet-blue text-3xl font-black text-white shadow-lg shadow-blue-900/10 transition-all hover:shadow-xl dark:bg-blue-600">
                {user.profile?.profilePhotoUrl ? (
                  <Image
                    src={user.profile.profilePhotoUrl}
                    alt={fullName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <EditProfilePhotoDialog
                userId={user.id}
                currentPhotoUrl={user.profile?.profilePhotoUrl}
              />
            </div>
            <div>
              <h1 className="mb-2 text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
                {fullName}
              </h1>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${roleColors[user.role] ?? 'bg-slate-100 text-slate-500'}`}
                >
                  {user.role}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${statusColors[user.status] ?? 'bg-slate-100 text-slate-500'}`}
                >
                  {user.status}
                </span>
                <span className="ml-1 font-mono text-xs text-slate-400 dark:text-slate-500">
                  {user.studentProfile?.studentId ? (
                    <>ID: {user.studentProfile.studentId}</>
                  ) : user.role === 'APPLICANT' && user.registrationCode ? (
                    <>Reg Code: {user.registrationCode}</>
                  ) : user.instructorProfile?.employeeId ? (
                    <>ID: {user.instructorProfile.employeeId}</>
                  ) : user.staffProfile?.employeeId ? (
                    <>ID: {user.staffProfile.employeeId}</>
                  ) : (
                    <>No Assigned ID</>
                  )}
                </span>
              </div>
            </div>
          </div>
          <UserActionsMenu
            userId={user.id}
            userStatus={user.status}
            userEmail={user.email}
            userRole={user.role}
            userName={fullName}
            isEmailVerified={!!user.emailVerified}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Contact Information */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                <UserIcon className="h-4 w-4" /> Personal Information
              </h2>
              <EditProfileDialog
                userId={user.id}
                initialData={{
                  firstName: user.profile?.firstName,
                  middleName: user.profile?.middleName || undefined,
                  lastName: user.profile?.lastName,
                  email: user.email,
                  personalEmail: user.personalEmail,
                  phone: user.profile?.phone || undefined,
                  nationality: user.profile?.nationality || undefined,
                  dateOfBirth: user.profile?.dateOfBirth,
                }}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                  {user.academyEmail ? 'Academy Email' : 'Email Address'}
                </p>
                <div className="flex items-center gap-2 font-bold break-all text-slate-700 dark:text-slate-300">
                  <Mail className="h-4 w-4 text-aerojet-sky dark:text-blue-400" />
                  {user.academyEmail || user.email}
                </div>
              </div>
              {user.personalEmail && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                    Personal Email
                  </p>
                  <div className="flex items-center gap-2 font-bold break-all text-slate-700 dark:text-slate-300">
                    <Mail className="h-4 w-4 text-aerojet-sky dark:text-blue-400" />
                    {user.personalEmail}
                  </div>
                </div>
              )}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                  Phone Number
                </p>
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                  <Phone className="h-4 w-4 text-aerojet-sky dark:text-blue-400" />
                  {user.profile?.phone ?? '—'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                  Nationality
                </p>
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                  <Globe className="h-4 w-4 text-aerojet-sky dark:text-blue-400" />
                  {user.profile?.nationality ?? '—'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                  Date of Birth
                </p>
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                  <Calendar className="h-4 w-4 text-aerojet-sky dark:text-blue-400" />
                  {user.profile?.dateOfBirth
                    ? new Date(user.profile.dateOfBirth).toLocaleDateString()
                    : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Role Specific Details */}
          {['STUDENT', 'APPLICANT'].includes(user.role) && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <h2 className="mb-4 flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                <UserIcon className="h-4 w-4" /> Student Profile
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                    Student ID
                  </p>
                  <div className="flex items-center">
                    <p className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {user.studentProfile?.studentId || 'Not Assigned'}
                    </p>
                    {user.studentProfile && (
                      <EditIdDialog
                        userId={user.id}
                        currentId={user.studentProfile.studentId}
                        type="studentId"
                        label="Student ID"
                      />
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                    Enrollment Status
                  </p>
                  <p className="font-bold text-slate-700 dark:text-slate-300">
                    {user.studentProfile?.enrollmentStatus || 'PENDING'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                    Study Pathway
                  </p>
                  <div className="flex items-center">
                    <p className="font-bold text-slate-700 dark:text-slate-300">
                      {user.studentProfile?.pathwayRel?.name || 'Not Selected'}
                    </p>
                    <EditPathwayDialog
                      userId={user.id}
                      currentPathway={(user.studentProfile?.pathwayRel?.code as any) || null}
                      isLocked={user.studentProfile?.studyPathwayLocked || false}
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                    Academic Period
                  </p>
                  <div className="flex items-center">
                    <p className="font-bold text-slate-700 dark:text-slate-300">
                      {user.studentProfile?.academicYear?.name || 'Not Assigned'}
                      {user.studentProfile?.semester?.name &&
                        ` — ${user.studentProfile.semester.name}`}
                    </p>
                    <EditAcademicPeriodDialog
                      userId={user.id}
                      currentAcademicYearId={user.studentProfile?.academicYearId}
                      currentAcademicYearName={user.studentProfile?.academicYear?.name}
                      currentSemesterId={user.studentProfile?.semesterId}
                      currentSemesterName={user.studentProfile?.semester?.name}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Academic History for Students */}
          {['STUDENT', 'APPLICANT'].includes(user.role) && (
            <AcademicHistorySection
              enrollments={(user.enrollments || []).map((e) => ({
                id: e.id,
                status: e.status,
                completedAt: e.completedAt?.toISOString() ?? null,
                course: e.course,
                academicYear: e.academicYear,
                semester: e.semester,
              }))}
              examBookings={(user.examBookings || []).map((b) => ({
                id: b.id,
                moduleCode: b.moduleCode,
                result: b.result,
                score: b.score != null ? Number(b.score) : null,
                percentage: b.percentage != null ? Number(b.percentage) : null,
                attemptType: b.attemptType,
                sourceNotes: b.sourceNotes,
                examDate: b.examDate?.toISOString() ?? null,
                status: b.status,
              }))}
              studentProfile={user.studentProfile ? {
                studentId: user.studentProfile.studentId,
                enrollmentStatus: user.studentProfile.enrollmentStatus,
                fundingSource: user.studentProfile.fundingSource,
                currentYearNumber: user.studentProfile.currentYearNumber,
                currentSemesterNumber: user.studentProfile.currentSemesterNumber,
                programmeChoice: user.studentProfile.programmeChoice,
              } : null}
            />
          )}

          {/* OJT Section for Full-Time Students */}
          {user.role === 'STUDENT' && ojtData.length > 0 && (
            <OjtSection userId={user.id} enrollments={ojtData} />
          )}

          {user.role === 'INSTRUCTOR' && user.instructorProfile && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <h2 className="mb-4 flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                <UserIcon className="h-4 w-4" /> Instructor Details
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                    Employee ID
                  </p>
                  <div className="flex items-center">
                    <p className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {user.instructorProfile.employeeId}
                    </p>
                    <EditIdDialog
                      userId={user.id}
                      currentId={user.instructorProfile.employeeId}
                      type="employeeId"
                      label="Employee ID"
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                    Specializations
                  </p>
                  <p className="font-medium text-slate-700 dark:text-slate-300">
                    {user.instructorProfile.specialization || 'None listed'}
                  </p>
                </div>
                {user.instructorProfile.qualifications && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                    <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                      Qualifications
                    </p>
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      {user.instructorProfile.qualifications}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {['STAFF', 'ADMIN', 'SUPER_ADMIN'].includes(user.role) && user.staffProfile && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <h2 className="mb-4 flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                <UserIcon className="h-4 w-4" /> Staff Details
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                    Employee ID
                  </p>
                  <div className="flex items-center">
                    <p className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {user.staffProfile.employeeId}
                    </p>
                    <EditIdDialog
                      userId={user.id}
                      currentId={user.staffProfile.employeeId}
                      type="employeeId"
                      label="Employee ID"
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                    Department
                  </p>
                  <p className="font-bold text-slate-700 dark:text-slate-300">
                    {user.staffProfile.department ?? 'General'}
                  </p>
                </div>
                {user.staffProfile.position && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                    <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                      Position
                    </p>
                    <p className="font-bold text-slate-700 dark:text-slate-300">
                      {user.staffProfile.position}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <h2 className="mb-4 flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
              <Shield className="h-4 w-4" /> Account Status
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Joined</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Last Active
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">Today</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
