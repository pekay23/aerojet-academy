import { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import ProfileForm from './_components/ProfileForm'
import ProfileTabs from './_components/ProfileTabs'
import ChangePasswordForm from '@/components/shared/ChangePasswordForm'
import { serializeUserProfile } from '@/lib/student/serialization'

export const metadata: Metadata = {
  title: 'My Profile | Student Portal',
  description: 'Manage your personal and academic profile.',
}
export const dynamic = 'force-dynamic'

import SettingsForm from './_components/SettingsForm'

async function InfoTab() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      role: true,
      profile: true,
      studentProfile: {
        include: {
          pathwayRel: {
            select: { name: true },
          },
        },
      },
      settings: true,
    },
  })

  if (!user) redirect('/login')

  const serializedUser = serializeUserProfile(user)

  return <ProfileForm user={serializedUser} />
}

async function SettingsTab() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      settings: true,
    },
  })

  if (!user) redirect('/login')

  const serializedSettings = user.settings || {}

  return <SettingsForm initialSettings={serializedSettings} />
}

function PasswordTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm sm:p-10 dark:border-slate-800 dark:bg-slate-900">
        <ChangePasswordForm apiEndpoint="/api/student/profile/change-password" />
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <strong>Tip:</strong> Use a combination of letters, numbers, and symbols to create a
          strong password. Avoid using common words or personal information.
        </p>
      </div>
    </div>
  )
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'info' } = await searchParams

  return (
    <ProfileTabs>
      {tab === 'settings' ? <SettingsTab /> : tab === 'password' ? <PasswordTab /> : <InfoTab />}
    </ProfileTabs>
  )
}
