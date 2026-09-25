import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import ProfileForm from './_components/ProfileForm'
import { PasskeySettings } from '@/app/staff/settings/_components/PasskeySettings'
import { PageTransition } from '@/components/shared/PageTransition'

export const metadata: Metadata = { title: 'My Profile | Applicant Portal' }
export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const session = await getAuthSession()
  if (!session) return await redirectToLogin()

  const userId = session.user.id

  const [user, profile] = await Promise.all([
    prismaUnfiltered.user.findUnique({
      where: { id: userId },
      select: { email: true, registrationCode: true, createdAt: true },
    }),
    prismaUnfiltered.profile.findUnique({
      where: { userId },
    }),
  ])

  if (!user) return await redirectToLogin()

  return (
    <PageTransition className="max-w-7xl space-y-8">
      <div>
        <h1 className="text-aerojet-blue text-3xl font-black tracking-tight dark:text-white">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Keep your personal information up to date.
        </p>
      </div>

      {/* Account Info (read-only) */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-sm font-bold tracking-widest text-slate-900 uppercase dark:text-slate-100">
          Account Details
        </h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Email</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{user.email}</dd>
          </div>
          {user.registrationCode && (
            <div>
              <dt className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                Registration Code
              </dt>
              <dd className="mt-0.5 font-mono font-bold text-slate-700">{user.registrationCode}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
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

      {/* Security — Passkeys */}
      <PasskeySettings />
    </PageTransition>
  )
}
