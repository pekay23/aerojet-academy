import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import ProfileForm from './_components/ProfileForm'

export const metadata: Metadata = { title: 'My Profile | Applicant Portal' }
export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const userId = (session.user as any).id

  const [user, profile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, registrationCode: true, createdAt: true },
    }),
    prisma.profile.findUnique({
      where: { userId },
    }),
  ])

  if (!user) redirect('/login')

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Keep your personal information up to date.</p>
      </div>

      {/* Account Info (read-only) */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100">
          Account Details
        </h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{user.email}</dd>
          </div>
          {user.registrationCode && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Registration Code
              </dt>
              <dd className="mt-0.5 font-mono font-bold text-slate-700">{user.registrationCode}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Member Since
            </dt>
            <dd className="mt-0.5 font-medium text-slate-700">
              {user.createdAt.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </dd>
          </div>
        </dl>
      </div>

      {/* Editable Profile Form */}
      <ProfileForm profile={profile} />
    </div>
  )
}
