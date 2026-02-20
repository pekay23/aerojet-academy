import { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import ProfileForm from './_components/ProfileForm'

export const metadata: Metadata = { title: 'My Profile | Student Portal' }

export default async function ProfilePage() {
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

  // Serialize dates for Client Component
  const serializedUser = JSON.parse(JSON.stringify(user))

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your personal and academic information.
        </p>
      </div>

      <ProfileForm user={serializedUser} />
    </div>
  )
}
