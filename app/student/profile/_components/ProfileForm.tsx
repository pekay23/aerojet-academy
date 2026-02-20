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

interface ProfileFormProps {
  user: any
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'personal' | 'security' | 'notifications'>('personal')

  // Personal Info State
  const [phone, setPhone] = useState(user.profile?.phone || '')
  const [address, setAddress] = useState(user.profile?.address || '')
  const [middleName, setMiddleName] = useState(user.profile?.middleName || '')

  // Password State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Helper to format date
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Not provided'
    return new Date(date).toLocaleDateString()
  }

  const fullName = user.profile
    ? `${user.profile.firstName} ${user.profile.lastName}`
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    startTransition(async () => {
      const result = await changePassword(currentPassword, newPassword)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Password changed successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    })
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Left Column: Navigation & Avatar */}
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
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                Student ID
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
              activeTab === 'personal'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
            }`}
          >
            <User className="h-4 w-4" />
            Personal Info
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
              activeTab === 'security'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
            }`}
          >
            <Lock className="h-4 w-4" />
            Account Security
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
              activeTab === 'notifications'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
            }`}
          >
            <Bell className="h-4 w-4" />
            Notifications
          </button>
        </div>
      </div>

      {/* Right Column: Forms */}
      <div className="space-y-6 lg:col-span-2">
        {activeTab === 'personal' && (
          <div className="space-y-6">
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
                      value={formatDate(user.profile?.dateOfBirth)}
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
            <div className="rounded-2xl border border-slate-100 bg-slate-900 p-8 text-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <h3 className="mb-6 flex items-center gap-2 border-b border-white/10 pb-4 text-lg font-black italic">
                <GraduationCap className="h-5 w-5 text-blue-400" />
                Academic Details
              </h3>

              <div className="grid gap-6 text-slate-300 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                    Current Program
                  </p>
                  <p className="text-[10px] font-bold tracking-wider text-white uppercase">
                    {user.studentProfile?.enrollmentType.replace('_', ' ') || 'Modular Training'}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                    Admission Date
                  </p>
                  <p className="font-bold text-white">
                    {formatDate(user.studentProfile?.enrollmentDate)}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                    Status
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-green-400" />
                    <span className="text-xs font-black text-white uppercase">Active Student</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <form
            onSubmit={handleChangePassword}
            className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
          >
            <h3 className="mb-6 flex items-center gap-2 border-b border-slate-50 pb-4 text-lg font-black text-slate-900 dark:border-slate-800 dark:text-white">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Change Password
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400"
                  required
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
                Update Password
              </button>
            </div>
          </form>
        )}

        {activeTab === 'notifications' && (
          <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
            <h3 className="mb-6 flex items-center gap-2 border-b border-slate-50 pb-4 text-lg font-black text-slate-900 dark:border-slate-800 dark:text-white">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Notification Settings
            </h3>

            <div className="flex items-center justify-between rounded-xl border border-slate-100 p-4 dark:border-slate-800">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Email Notifications</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Receive updates and announcements via email.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                  Enabled
                </span>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              * Notification settings are currently managed by the administrator.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
