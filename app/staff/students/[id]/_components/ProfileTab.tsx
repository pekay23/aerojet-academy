'use client'

import {
  Mail,
  Phone,
  Globe,
  Calendar,
  BookOpen,
  GraduationCap,
  User,
} from 'lucide-react'
import EditProfileDialog from '@/app/staff/users/[id]/_components/EditProfileDialog'
import EditIdDialog from '@/app/staff/users/[id]/_components/EditIdDialog'
import EditPathwayDialog from '@/app/staff/users/[id]/_components/EditPathwayDialog'
import EditAcademicPeriodDialog from '@/app/staff/users/[id]/_components/EditAcademicPeriodDialog'
import UserActionsMenu from '@/app/staff/_components/UserActionsMenu'

interface Props {
  student: {
    id: string
    email: string
    personalEmail?: string | null
    academyEmail?: string | null
    status: string
    emailVerified: string | Date | null
    createdAt: string | Date
    lastLoginAt?: string | Date | null
    registrationPaid: boolean
    isAmbassador: boolean
    referralCode?: string | null
    programmeChoice?: string | null
    referralsReceived?: any[]
    referralsMade?: any[]
    profile: any
    studentProfile: any
  }
  academicYears: { id: string; name: string }[]
  semesters: { id: string; name: string }[]
  studyPathways: { id: string; name: string; code: string }[]
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
      {/* Registration Fee Status Banner */}
      <div
        className={`flex items-center gap-4 rounded-2xl border p-5 shadow-sm ${
          student.registrationPaid
            ? 'border-emerald-200 bg-linear-to-r from-emerald-50 to-emerald-100/50 dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-emerald-900/20'
            : 'border-amber-200 bg-linear-to-r from-amber-50 to-amber-100/50 dark:border-amber-900/40 dark:from-amber-950/30 dark:to-amber-900/20'
        }`}
      >
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            student.registrationPaid
              ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
              : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
          }`}
        >
          {student.registrationPaid ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          )}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-black ${
            student.registrationPaid
              ? 'text-emerald-800 dark:text-emerald-300'
              : 'text-amber-800 dark:text-amber-300'
          }`}>
            {student.registrationPaid ? 'Registration Fee Paid' : 'Registration Fee Outstanding'}
          </p>
          <p className={`mt-0.5 text-xs ${
            student.registrationPaid
              ? 'text-emerald-600/70 dark:text-emerald-400/60'
              : 'text-amber-600/70 dark:text-amber-400/60'
          }`}>
            {student.registrationPaid
              ? 'This student has completed registration payment and is fully onboarded.'
              : 'This student has not yet completed their registration fee payment.'}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase ${
            student.registrationPaid
              ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
              : 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
          }`}
        >
          {student.registrationPaid ? 'Paid' : 'Unpaid'}
        </span>
      </div>

      {/* Personal Information */}
      <Section
        title="Personal Information"
        action={
          <div className="flex items-center gap-2">
            <UserActionsMenu
              userId={student.id}
              userStatus={student.status}
              userEmail={student.email}
              isEmailVerified={!!student.emailVerified}
              onActionComplete={onRefresh}
            />
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
          </div>
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

      {/* Programme & Pathway */}
      <Section
        title="Programme & Pathway"
        action={
          <div className="flex items-center gap-2">
            {sp?.studentId && (
              <EditIdDialog
                userId={student.id}
                currentId={sp.studentId}
                type="studentId"
                label="Student ID"
              />
            )}
            <EditPathwayDialog
              userId={student.id}
              currentPathway={sp?.pathwayRel?.code || null}
              isLocked={sp?.studyPathwayLocked || false}
            />
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field icon={User} label="Student ID" value={sp?.studentId ?? '—'} />
          <Field
            icon={Calendar}
            label="Enrollment Date"
            value={
              sp?.enrollmentDate
                ? new Date(sp.enrollmentDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'
            }
          />
          <Field icon={User} label="Enrollment Status" value={sp?.enrollmentStatus ?? '—'} />
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
                .map((t) => t.licenseCategory?.name || t.licenseCategory?.code)
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

      {/* Referral Network */}
      <Section title="Referral Network">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Referrer */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
            <h4 className="mb-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">Referred By</h4>
            {student.referralsReceived && student.referralsReceived.length > 0 ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-aerojet-blue font-bold dark:bg-blue-900/30">
                  {student.referralsReceived[0].referrer.profile?.firstName?.[0]}{student.referralsReceived[0].referrer.profile?.lastName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {student.referralsReceived[0].referrer.profile?.firstName} {student.referralsReceived[0].referrer.profile?.lastName}
                  </p>
                  <p className="text-xs text-slate-500">{student.referralsReceived[0].referrer?.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs italic text-slate-400">Direct registration (No referrer)</p>
            )}
          </div>

          {/* Referrals Made */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
            <h4 className="mb-3 text-[10px] font-black tracking-widest text-slate-400 uppercase">Referrals Made</h4>
            {student.referralsMade && student.referralsMade.length > 0 ? (
              <div className="space-y-3">
                {student.referralsMade.slice(0, 5).map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-200 text-[10px] flex items-center justify-center font-bold dark:bg-slate-700">
                        {ref.referee.profile?.firstName?.[0]}
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {ref.referee.profile?.firstName} {ref.referee.profile?.lastName}
                      </p>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                      ref.status === 'QUALIFIED' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700'
                    }`}>
                      {ref.status}
                    </span>
                  </div>
                ))}
                {student.referralsMade.length > 5 && (
                  <p className="text-[10px] text-center text-slate-400">+{student.referralsMade.length - 5} more referrals</p>
                )}
              </div>
            ) : (
              <p className="text-xs italic text-slate-400">Has not referred anyone yet</p>
            )}
          </div>
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
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between border-b border-slate-200/60 pb-2 dark:border-slate-700/60">
        <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">{title}</h3>
        {action && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 dark:border-slate-700 dark:bg-slate-800">
            {action}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

function Field({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-white px-4 py-3 dark:border-slate-700/50 dark:bg-slate-900">
      <p className="mb-1 flex items-center gap-1.5 text-[10px] font-black tracking-widest text-slate-400 uppercase">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="truncate text-sm font-bold text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  )
}
