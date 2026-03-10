import { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import ProfileForm from './_components/ProfileForm'
import ProfileTabs from './_components/ProfileTabs'
import ChangePasswordForm from '@/components/shared/ChangePasswordForm'

export const metadata: Metadata = {
  title: 'My Profile | Student Portal',
  description: 'Manage your personal and academic profile.',
}
export const dynamic = 'force-dynamic'

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
      studentProfile: true,
    },
  })

  if (!user) redirect('/login')

  const serializedUser = JSON.parse(JSON.stringify(user))

  return <ProfileForm user={serializedUser} />
}

function SettingsTab() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center sm:p-12 dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
        <span className="text-2xl">🚧</span>
      </div>
      <h2 className="mb-2 text-lg font-bold text-slate-700 dark:text-slate-300">Coming Soon</h2>
      <p className="mx-auto max-w-md text-sm text-slate-400">
        This feature is under development and will be available soon.
      </p>
    </div>
  )
}

function PasswordTab() {
  return (
    <div className="max-w-2xl space-y-6">
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
      {tab === 'settings' ? (
        <SettingsTab />
      ) : tab === 'password' ? (
        <PasswordTab />
      ) : (
        <InfoTab />
      )}
    </ProfileTabs>
  )
}
