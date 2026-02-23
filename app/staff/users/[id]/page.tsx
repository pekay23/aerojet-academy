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
      studentProfile: true,
      instructorProfile: true,
      staffProfile: true,
    },
  })

  if (!user) notFound()

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
          className="mb-4 inline-flex items-center text-sm font-bold text-slate-400 transition-colors hover:text-[#002a5c] dark:text-slate-500 dark:hover:text-blue-400"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Users
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-[#002a5c] text-3xl font-black text-white shadow-lg shadow-blue-900/10 transition-all hover:shadow-xl dark:bg-blue-600">
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
              <h1 className="mb-2 text-3xl font-black tracking-tight text-[#002a5c] dark:text-white">
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
                    <>Internal ID: {user.id.slice(0, 8)}</>
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
                  phone: user.profile?.phone || undefined,
                  nationality: user.profile?.nationality || undefined,
                  dateOfBirth: user.profile?.dateOfBirth,
                }}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                  Email Address
                </p>
                <div className="flex items-center gap-2 font-bold break-all text-slate-700 dark:text-slate-300">
                  <Mail className="h-4 w-4 text-[#4c9ded] dark:text-blue-400" />
                  {user.email}
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                  Phone Number
                </p>
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                  <Phone className="h-4 w-4 text-[#4c9ded] dark:text-blue-400" />
                  {user.profile?.phone ?? '—'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                  Nationality
                </p>
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                  <Globe className="h-4 w-4 text-[#4c9ded] dark:text-blue-400" />
                  {user.profile?.nationality ?? '—'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                  Date of Birth
                </p>
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                  <Calendar className="h-4 w-4 text-[#4c9ded] dark:text-blue-400" />
                  {user.profile?.dateOfBirth
                    ? new Date(user.profile.dateOfBirth).toLocaleDateString()
                    : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Role Specific Details */}
          {user.role === 'STUDENT' && user.studentProfile && (
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
                      {user.studentProfile.studentId}
                    </p>
                    <EditIdDialog
                      userId={user.id}
                      currentId={user.studentProfile.studentId}
                      type="studentId"
                      label="Student ID"
                    />
                  </div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase dark:text-slate-500">
                    Enrollment Status
                  </p>
                  <p className="font-bold text-slate-700 dark:text-slate-300">
                    {user.studentProfile.enrollmentStatus}
                  </p>
                </div>
              </div>
            </div>
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
