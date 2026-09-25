import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { getAuthSession } from '@/lib/auth/helpers'
import { notFound } from 'next/navigation'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'
import { getCachedExamComponents } from '@/lib/cached-queries'
import Link from 'next/link'
import { ProtectedImage } from '@/components/ProtectedImage'
import { proxyImageUrl } from '@/lib/storage/signed-url'
import { ArrowLeft, Mail, Phone, Globe, Calendar, User as UserIcon, Shield } from 'lucide-react'
import UserActionsMenu from '../../_components/UserActionsMenu'
import EditIdDialog from './_components/EditIdDialog'
import EditProfileDialog from './_components/EditProfileDialog'
import EditProfilePhotoDialog from './_components/EditProfilePhotoDialog'
import EditPathwayDialog from './_components/EditPathwayDialog'
import EditAcademicPeriodDialog from './_components/EditAcademicPeriodDialog'
import OjtSection from './_components/OjtSection'
import AcademicHistorySection from './_components/AcademicHistorySection'
import EditInstructorProfileDialog from './_components/EditInstructorProfileDialog'
import EditStaffProfileDialog from './_components/EditStaffProfileDialog'
import LastActive from './_components/LastActive'
import { Metadata } from 'next'
import { PathwayCode } from './_components/EditPathwayDialog'
import { UserStatus, UserRole, EnrollmentStatus } from '@/types/enums'
import type { SerializedFullTimeEnrollmentForOjt, SerializedStudent } from '@/lib/staff/types'

export const metadata: Metadata = { title: 'User Details | Staff Portal' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function UserProfilePage({ params }: Props) {
  const session = await getAuthSession()
  if (!session) return await redirectToLogin()

  const { id } = await params

  // Resolve slug to user ID via SQL instead of loading all users into memory
  let targetId = id
  // If the id doesn't look like a UUID/CUID, treat it as a slug
  if (!id.match(/^[0-9a-f-]{36}$|^c[a-z0-9]{24,}$/i)) {
    const slugMatch = await prismaUnfiltered.$queryRaw<{ id: string }[]>`
      SELECT u.id FROM "users" u
      JOIN "profiles" p ON p."userId" = u.id
      WHERE u."deletedAt" IS NULL
        AND lower(
          regexp_replace(
            regexp_replace(
              trim(lower(concat_ws(' ', p."firstName", p."lastName"))),
              '[^\\w\\s-]', '', 'g'
            ),
            '\\s+', '-', 'g'
          )
        ) = ${id}
      LIMIT 1
    `
    if (slugMatch.length > 0) targetId = slugMatch[0].id
  }

  const userRaw = await prismaUnfiltered.user.findUnique({
    where: { id: targetId },
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
        take: 50,
      },
      examBookings: {
        where: { deletedAt: null },
        orderBy: { examDate: 'asc' },
        take: 50,
        select: {
          id: true,
          moduleCode: true,
          result: true,
          score: true,
          percentage: true,
          attemptType: true,
          examDate: true,
          status: true,
          examCategory: true,
          examAttendance: { select: { status: true } },
        },
      },
    },
  })

  if (!userRaw) notFound()
  const user = serializePrisma(
    userRaw
  ) as unknown as SerializedStudent as unknown as SerializedStudent

  // Fetch OJT + exam components in parallel (both independent of each other)
  const [ftEnrollmentsRaw, examComponentsRaw] = await Promise.all([
    user.role === UserRole.STUDENT
      ? prismaUnfiltered.fullTimeEnrollment.findMany({
          where: { studentId: user.id },
          include: {
            programme: { select: { code: true, name: true } },
            ojtPeriods: { orderBy: { startDate: 'desc' } },
          },
        })
      : Promise.resolve([]),
    getCachedExamComponents(),
  ])

  const ftEnrollments = serializePrisma(ftEnrollmentsRaw)

  const ojtData = ftEnrollments.map((e: SerializedFullTimeEnrollmentForOjt) => ({
    id: e.id,
    programme: e.programme,
    ojtPeriods: e.ojtPeriods,
  }))

  const examComponents = serializePrisma(examComponentsRaw)

  const profile = user.profile
  const fullName = profile
    ? [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ')
    : user.email

  const initials = profile
    ? `${profile.firstName[0]}${profile.lastName[0]}`
    : user.email[0].toUpperCase()

  const statusColors: Record<string, string> = {
    [UserStatus.ACTIVE]:
      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    [UserStatus.PENDING]: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    [UserStatus.SUSPENDED]: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    [UserStatus.ARCHIVED]: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
    [UserStatus.DEACTIVATED]: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
  }

  const roleColors: Record<string, string> = {
    [UserRole.SUPER_ADMIN]: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    [UserRole.ADMIN]: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    [UserRole.STAFF]: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    [UserRole.INSTRUCTOR]: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    [UserRole.STUDENT]:
      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    [UserRole.APPLICANT]: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  }

  return (
    <div className="mx-auto max-w-450">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/staff/users"
          className="hover:text-aerojet-blue mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-bold text-slate-400 transition-all duration-150 ease-out hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800/60 dark:hover:text-blue-400"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Users
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="bg-aerojet-blue relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl text-3xl font-black text-white shadow-lg shadow-blue-900/10 transition-all hover:shadow-xl dark:bg-blue-600">
                {user.profile?.profilePhotoUrl ? (
                  <ProtectedImage
                    src={proxyImageUrl(user.profile.profilePhotoUrl, 'profile-photos')}
                    alt={fullName}
                    fill
                    sizes="96px"
                    className="object-cover"
                    priority
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
              <h1 className="text-aerojet-blue mb-2 text-3xl font-black tracking-tight dark:text-white">
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
                  ) : user.role === UserRole.APPLICANT && user.registrationCode ? (
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
                  <Mail className="text-aerojet-sky h-4 w-4 dark:text-blue-400" />
                  {user.academyEmail || user.email}
                </div>
              </div>
              {user.personalEmail && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                    Personal Email
                  </p>
                  <div className="flex items-center gap-2 font-bold break-all text-slate-700 dark:text-slate-300">
                    <Mail className="text-aerojet-sky h-4 w-4 dark:text-blue-400" />
                    {user.personalEmail}
                  </div>
                </div>
              )}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                  Phone Number
                </p>
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                  <Phone className="text-aerojet-sky h-4 w-4 dark:text-blue-400" />
                  {user.profile?.phone ?? '—'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                  Nationality
                </p>
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                  <Globe className="text-aerojet-sky h-4 w-4 dark:text-blue-400" />
                  {user.profile?.nationality ?? '—'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                  Date of Birth
                </p>
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                  <Calendar className="text-aerojet-sky h-4 w-4 dark:text-blue-400" />
                  {user.profile?.dateOfBirth
                    ? new Date(user.profile.dateOfBirth).toLocaleDateString()
                    : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Role Specific Details */}
          {[UserRole.STUDENT, UserRole.APPLICANT].includes(user.role as UserRole) && (
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
                      {user.studentProfile?.studentId ?? 'Not Assigned'}
                    </p>
                    {user.studentProfile && (
                      <EditIdDialog
                        userId={user.id}
                        currentId={user.studentProfile.studentId ?? ''}
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
                    {user.studentProfile?.enrollmentStatus || EnrollmentStatus.PENDING}
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
                      currentPathway={
                        (user.studentProfile?.pathwayRel?.code as PathwayCode) || null
                      }
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
                      currentAcademicYearId={user.studentProfile?.academicYear?.id}
                      currentAcademicYearName={user.studentProfile?.academicYear?.name}
                      currentSemesterId={user.studentProfile?.semester?.id}
                      currentSemesterName={user.studentProfile?.semester?.name}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Academic History for Students */}
          {[UserRole.STUDENT, UserRole.APPLICANT].includes(user.role as UserRole) && (
            <AcademicHistorySection
              studentId={user.id}
              studentName={fullName}
              examComponents={examComponents}
              enrollments={(user.enrollments || []).map((e) => ({
                id: e.id,
                status: e.status,
                completedAt: e.completedAt ?? null,
                course: { code: e.course?.code ?? '', name: e.course?.name ?? '' },
              }))}
              examBookings={(user.examBookings || []).map((b) => ({
                id: b.id,
                moduleCode: b.moduleCode,
                result: b.result,
                score: b.score,
                percentage: b.percentage,
                attemptType: b.attemptType,
                examDate: b.examDate,
                status: b.status,
                examCategory: b.examCategory,
              }))}
              studentProfile={
                user.studentProfile
                  ? {
                      studentId: user.studentProfile.studentId ?? '',
                      enrollmentStatus: user.studentProfile.enrollmentStatus ?? '',
                      fundingSource: user.studentProfile.fundingSource ?? '',
                      currentYearNumber: user.studentProfile.currentYearNumber ?? 0,
                      currentSemesterNumber: user.studentProfile.currentSemesterNumber ?? 0,
                      programmeChoice: user.studentProfile.programmeChoice ?? null,
                      enrollmentType: user.studentProfile.enrollmentType ?? null,
                    }
                  : null
              }
            />
          )}

          {/* OJT Section for Full-Time Students */}
          {user.role === UserRole.STUDENT && ojtData.length > 0 && (
            <OjtSection userId={user.id} enrollments={ojtData} />
          )}

          {user.role === UserRole.INSTRUCTOR && user.instructorProfile && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                  <UserIcon className="h-4 w-4" /> Instructor Details
                </h2>
                <EditInstructorProfileDialog
                  userId={user.id}
                  initialData={{
                    specialization: user.instructorProfile.specialization,
                    qualifications: user.instructorProfile.qualifications,
                    department: user.instructorProfile.department,
                  }}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                    Department
                  </p>
                  <p className="font-bold text-slate-700 dark:text-slate-300">
                    {user.instructorProfile.department || 'General'}
                  </p>
                </div>
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
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xs font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                  <UserIcon className="h-4 w-4" /> Staff Details
                </h2>
                <EditStaffProfileDialog
                  userId={user.id}
                  initialData={{
                    department: user.staffProfile.department ?? '',
                    position: user.staffProfile.position ?? '',
                  }}
                />
              </div>
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
                <LastActive ts={user.lastSeenAt ?? user.lastLoginAt} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
