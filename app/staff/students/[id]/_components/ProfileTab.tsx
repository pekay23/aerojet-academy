'use client'

import {
  Mail,
  Phone,
  Globe,
  Calendar,
  BookOpen,
  GraduationCap,
  User,
  KeyRound,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import EditProfileDialog from '@/app/staff/users/[id]/_components/EditProfileDialog'
import EditIdDialog from '@/app/staff/users/[id]/_components/EditIdDialog'
import EditProfilePhotoDialog from '@/app/staff/users/[id]/_components/EditProfilePhotoDialog'
import EditPathwayDialog from '@/app/staff/users/[id]/_components/EditPathwayDialog'
import EditAcademicPeriodDialog from '@/app/staff/users/[id]/_components/EditAcademicPeriodDialog'
import UserActionsMenu from '@/app/staff/_components/UserActionsMenu'
import Link from 'next/link'

interface Props {
  student: any
  academicYears: any[]
  semesters: any[]
  studyPathways: any[]
  onRefresh: () => void
}

export default function ProfileTab({
  student,
  academicYears,
  semesters,
  studyPathways,
  onRefresh,
}: Props) {
  const profile = student.profile
  const sp = student.studentProfile

  const fullName = profile
    ? [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ')
    : student.email

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <UserActionsMenu
          userId={student.id}
          userStatus={student.status}
          userEmail={student.email}
          isEmailVerified={!!student.emailVerified}
          onActionComplete={onRefresh}
        />
        <button
          onClick={async () => {
            try {
              const res = await fetch(`/api/staff/users/${student.id}/resend-credentials`, {
                method: 'POST',
              })
              if (!res.ok) throw new Error()
              toast.success('Login credentials resent')
            } catch {
              toast.error('Failed to resend credentials')
            }
          }}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 transition-all hover:border-[#4c9ded] hover:text-[#4c9ded] dark:border-slate-700 dark:bg-slate-800"
        >
          <KeyRound className="h-3.5 w-3.5" />
          Resend Credentials
        </button>
        <Link
          href={`/staff/users/${student.id}`}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 transition-all hover:border-[#4c9ded] hover:text-[#4c9ded] dark:border-slate-700 dark:bg-slate-800"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Full User Page
        </Link>
      </div>

      {/* Personal Information */}
      <Section
        title="Personal Information"
        action={
          <EditProfileDialog
            userId={student.id}
            initialData={{
              firstName: profile?.firstName || '',
              middleName: profile?.middleName || '',
              lastName: profile?.lastName || '',
              email: student.email,
              personalEmail: student.personalEmail,
              phone: profile?.phone || '',
              nationality: profile?.nationality || '',
              dateOfBirth: profile?.dateOfBirth,
            }}
          />
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field icon={User} label="Full Name" value={fullName} />
          {student.academyEmail && (
            <Field icon={Mail} label="Academy Email" value={student.academyEmail} />
          )}
          <Field icon={Mail} label="Personal Email" value={student.personalEmail || student.email} />
          <Field icon={Phone} label="Phone" value={profile?.phone ?? '—'} />
          <Field icon={Globe} label="Nationality" value={profile?.nationality ?? '—'} />
          <Field
            icon={Calendar}
            label="Date of Birth"
            value={
              profile?.dateOfBirth
                ? new Date(profile.dateOfBirth).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : '—'
            }
          />
          {profile?.address && <Field icon={Globe} label="Address" value={profile.address} />}
          {profile?.city && <Field icon={Globe} label="City" value={profile.city} />}
          {profile?.country && <Field icon={Globe} label="Country" value={profile.country} />}
        </div>
      </Section>

      {/* Emergency Contact */}
      {(profile?.emergencyContactName || profile?.emergencyContactPhone) && (
        <Section title="Emergency Contact">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profile?.emergencyContactName && (
              <Field icon={User} label="Contact Name" value={profile.emergencyContactName} />
            )}
            {profile?.emergencyContactPhone && (
              <Field icon={Phone} label="Contact Phone" value={profile.emergencyContactPhone} />
            )}
            {profile?.emergencyContactRelation && (
              <Field icon={User} label="Relationship" value={profile.emergencyContactRelation} />
            )}
          </div>
        </Section>
      )}

      {/* Student ID & Photo */}
      <Section
        title="Student Identity"
        action={
          <div className="flex gap-2">
            {sp?.studentId && (
              <EditIdDialog
                userId={student.id}
                currentId={sp.studentId}
                type="studentId"
                label="Student ID"
              />
            )}
            <EditProfilePhotoDialog
              userId={student.id}
              currentPhotoUrl={profile?.profilePhotoUrl}
            />
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field icon={User} label="Student ID" value={sp?.studentId ?? '—'} />
          <Field icon={Calendar} label="Enrollment Date" value={
            sp?.enrollmentDate
              ? new Date(sp.enrollmentDate).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'
          } />
          <Field icon={User} label="Enrollment Status" value={sp?.enrollmentStatus ?? '—'} />
        </div>
      </Section>

      {/* Programme & Pathway */}
      <Section
        title="Programme & Pathway"
        action={
          <EditPathwayDialog
            userId={student.id}
            currentPathway={sp?.pathwayRel?.code || null}
            isLocked={sp?.studyPathwayLocked || false}
          />
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            icon={GraduationCap}
            label="Enrollment Type"
            value={sp?.enrollmentType?.replace(/_/g, ' ') ?? '—'}
          />
          <Field
            icon={BookOpen}
            label="Study Pathway"
            value={sp?.pathwayRel?.name ?? '—'}
          />
          <Field
            icon={GraduationCap}
            label="Programme Choice"
            value={sp?.programmeChoice?.replace(/_/g, ' ') ?? student.programmeChoice?.replace(/_/g, ' ') ?? '—'}
          />
          {sp?.licenseTargets?.length > 0 && (
            <Field
              icon={BookOpen}
              label="License Targets"
              value={sp.licenseTargets
                .map((t: any) => t.licenseCategory?.name || t.licenseCategory?.code)
                .join(', ')}
            />
          )}
          <Field
            icon={BookOpen}
            label="Pathway Locked"
            value={sp?.studyPathwayLocked ? 'Yes' : 'No'}
          />
        </div>
      </Section>

      {/* Academic Period */}
      <Section
        title="Academic Period"
        action={
          <EditAcademicPeriodDialog
            userId={student.id}
            currentAcademicYearId={sp?.academicYearId}
            currentAcademicYearName={sp?.academicYear?.name}
            currentSemesterId={sp?.semesterId}
            currentSemesterName={sp?.semester?.name}
          />
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            icon={Calendar}
            label="Academic Year"
            value={sp?.academicYear?.name ?? '—'}
          />
          <Field
            icon={Calendar}
            label="Semester"
            value={sp?.semester?.name ?? '—'}
          />
          <Field
            icon={Calendar}
            label="Current Year"
            value={sp?.currentYearNumber ? `Year ${sp.currentYearNumber}` : '—'}
          />
          <Field
            icon={Calendar}
            label="Current Semester"
            value={sp?.currentSemesterNumber ? `Semester ${sp.currentSemesterNumber}` : '—'}
          />
          {sp?.CGPA && (
            <Field icon={GraduationCap} label="CGPA" value={String(sp.CGPA)} />
          )}
        </div>
      </Section>

      {/* Account Info */}
      <Section title="Account Information">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            icon={Calendar}
            label="Created"
            value={new Date(student.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          />
          <Field
            icon={Calendar}
            label="Last Login"
            value={
              student.lastLoginAt
                ? new Date(student.lastLoginAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Never'
            }
          />
          <Field
            icon={Mail}
            label="Email Verified"
            value={student.emailVerified ? 'Yes' : 'No'}
          />
          <Field
            icon={User}
            label="Registration Paid"
            value={student.registrationPaid ? 'Yes' : 'No'}
          />
          <Field
            icon={User}
            label="Is Ambassador"
            value={student.isAmbassador ? 'Yes' : 'No'}
          />
          {student.referralCode && (
            <Field icon={User} label="Referral Code" value={student.referralCode} />
          )}
        </div>
      </Section>
    </div>
  )
}

function Section({
  title,
  children,
  action,
}: {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

function Field({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <p className="mb-1 flex items-center gap-1.5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="truncate text-sm font-bold text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  )
}
