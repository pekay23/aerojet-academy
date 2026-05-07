import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Users, UserPlus, Gift, Target, ArrowRight } from 'lucide-react'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import SetReferrerForm from './_components/SetReferrerForm'
import { getOrCreateReferralCode } from '@/lib/referral/operations'
import { CopyButton } from '@/components/shared/CopyButton'

export const metadata: Metadata = {
  title: 'Ambassador Program | Student Portal',
  description: 'Manage your referrals and view your rewards.',
}
export const dynamic = 'force-dynamic'

export default async function AmbassadorPage() {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'STUDENT') redirect('/login')

  // Ensure referral code exists
  const referralCode = await getOrCreateReferralCode(session.user.id)

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      referralsMade: {
        include: {
          referee: { select: { email: true, profile: true } }
        },
        orderBy: { createdAt: 'desc' }
      },
      referralsReceived: {
        include: {
          referrer: { select: { email: true, profile: true } }
        }
      }
    }
  })

  if (!user) redirect('/login')

  const hasBeenReferred = user.referralsReceived.length > 0
  const referrer = hasBeenReferred ? user.referralsReceived[0].referrer : null

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-aerojet-blue sm:text-3xl dark:text-white">
            Ambassador Program
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Refer friends to Aerojet Academy and earn rewards. Track your referrals here.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:flex-row sm:items-center dark:border-blue-900/30 dark:bg-blue-900/10">
          <div>
            <p className="text-[10px] font-black tracking-widest text-blue-600 uppercase dark:text-blue-400">
              Your Referral Code
            </p>
            <p className="text-lg font-black text-slate-900 dark:text-white">{referralCode}</p>
          </div>
          <div className="flex gap-2">
            <CopyButton value={referralCode} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-aerojet-blue dark:bg-blue-900/20 dark:text-blue-400">
            <Users className="h-5 w-5" />
          </div>
          <p className="mt-4 text-xs font-bold tracking-widest text-slate-400 uppercase">
            Total Referrals
          </p>
          <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
            {user.referralsMade.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Target className="h-5 w-5" />
          </div>
          <p className="mt-4 text-xs font-bold tracking-widest text-slate-400 uppercase">
            Successful Referrals
          </p>
          <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
            {user.successfulReferrals}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
            <Gift className="h-5 w-5" />
          </div>
          <p className="mt-4 text-xs font-bold tracking-widest text-slate-400 uppercase">
            Ambassador Status
          </p>
          <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">
            {user.isAmbassador ? 'Active VIP' : 'Standard'}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">
                Your Referrals
              </h2>
            </div>
            {user.referralsMade.length === 0 ? (
              <div className="p-12 text-center">
                <UserPlus className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">No referrals yet</p>
                <p className="mt-1 text-xs text-slate-500">Share your email with friends so they can add you as their referrer.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {user.referralsMade.map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between p-6">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {ref.referee.profile?.firstName} {ref.referee.profile?.lastName}
                      </p>
                      <p className="text-xs text-slate-500">{ref.referee.email}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase ${
                      ref.status === 'QUALIFIED' 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                    }`}>
                      {ref.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          {!hasBeenReferred ? (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
                Who referred you?
              </h3>
              <p className="mt-2 mb-4 text-xs text-slate-500">
                If a friend recommended Aerojet Academy, enter their <b>Email address</b> or <b>Referral Code</b> to link your accounts.
              </p>
              <SetReferrerForm />
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
                Referred By
              </h3>
              {referrer && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-aerojet-blue font-bold dark:bg-blue-900/30">
                    {referrer.profile?.firstName?.[0]}{referrer.profile?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {referrer.profile?.firstName} {referrer.profile?.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{referrer.email}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
