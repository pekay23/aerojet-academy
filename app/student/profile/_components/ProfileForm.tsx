'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  User,
  Phone,
  MapPin,
  Lock,
  Bell,
  Loader2,
  Save,
  Shield,
  GraduationCap,
  BadgeCheck,
  Calendar,
  Mail,
} from 'lucide-react'
import { updateStudentProfile, changePassword } from '@/app/student/actions'

interface ProfileUser {
  email: string
  role: string
  profile?: {
    firstName: string
    lastName: string
    middleName?: string | null
    phone?: string | null
    address?: string | null
    dateOfBirth?: Date | string | null
    profilePhotoUrl?: string | null
  } | null
  studentProfile?: {
    studentId?: string | null
    enrollmentType?: string | null
    pathwayName?: string | null
    enrollmentDate?: Date | string | null
  } | null
}

interface ProfileFormProps {
  user: ProfileUser
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Personal Info State
  const [phone, setPhone] = useState(user.profile?.phone || '')
  const [address, setAddress] = useState(user.profile?.address || '')
  const [middleName, setMiddleName] = useState(user.profile?.middleName || '')

  // Helper to format date
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Not provided'
    return new Date(date).toLocaleDateString()
  }

  const fullName = user.profile
    ? [user.profile.firstName, user.profile.middleName, user.profile.lastName]
        .filter(Boolean)
        .join(' ')
    : user.email.split('@')[0]

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateStudentProfile({ phone, address, middleName })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Profile updated successfully')
        router.refresh()
      }
    })
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Left Column: Avatar & Summary */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <div className="relative mx-auto mb-4 h-32 w-32">
            <div className="h-full w-full overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md dark:border-slate-800 dark:bg-slate-800">
              {user.profile?.profilePhotoUrl ? (
                <Image
                  src={user.profile.profilePhotoUrl}
                  alt={fullName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-black text-slate-300">
                  {fullName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <h2 className="text-xl font-black text-slate-900 dark:text-white">{fullName}</h2>
          <p className="mt-1 text-xs font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
            {user.role}
          </p>

          <div className="mt-6 flex justify-center gap-4 border-t border-slate-50 pt-6 dark:border-slate-800">
            <div className="text-center">
              <p className="text-lg font-black text-slate-900 dark:text-white">
                {user.studentProfile?.studentId || 'N/A'}
              </p>
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                Student ID
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6 dark:border-blue-900/30 dark:bg-blue-900/10">
          <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> Some fields are managed by the administration. To update your
            formal name or date of birth, please contact the academy office.
          </p>
        </div>
      </div>

      {/* Right Column: Profile Form */}
      <div className="space-y-6 lg:col-span-2">
        <form
          onSubmit={handleUpdateProfile}
          className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
        >
          <h3 className="mb-6 flex items-center gap-2 border-b border-slate-50 pb-4 text-lg font-black text-slate-900 dark:border-slate-800 dark:text-white">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Personal Information
          </h3>

          <div className="grid gap-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                  First Name
                </label>
                <input
                  type="text"
                  disabled
                  value={user.profile?.firstName || ''}
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                  Middle/Other Names
                </label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                  Last Name
                </label>
                <input
                  type="text"
                  disabled
                  value={user.profile?.lastName || ''}
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                  Email Address
                </label>
                <input
                  type="text"
                  disabled
                  value={user.email}
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
                />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                  Date of Birth
                </label>
                <input
                  type="text"
                  disabled
                  value={formatDate(user.profile?.dateOfBirth ?? null)}
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
                  placeholder="+233 ..."
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                Residential Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
                rows={3}
                placeholder="Enter your address..."
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </button>
          </div>
        </form>

        {/* Academic Information (Read Only) */}
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-slate-900 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 dark:text-white">
          <h3 className="mb-6 flex items-center gap-2 border-b border-slate-50 pb-4 text-lg font-black italic dark:border-slate-800">
            <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Academic Details
          </h3>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                Current Program
              </p>
              <p className="text-xs font-bold tracking-wider text-slate-900 uppercase dark:text-white">
                {user.studentProfile?.pathwayName ||
                  user.studentProfile?.enrollmentType?.replace('_', ' ') ||
                  'Modular Training'}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                Admission Date
              </p>
              <p className="font-bold text-slate-900 dark:text-white">
                {formatDate(user.studentProfile?.enrollmentDate ?? null)}
              </p>
            </div>
            <div>
              <p className="mb-1 text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                Status
              </p>
              <div className="mt-1 flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-black text-slate-900 uppercase dark:text-white">
                  Active Student
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
