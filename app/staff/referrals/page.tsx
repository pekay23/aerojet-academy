import { Metadata } from 'next'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import ReferralsManager from './_components/ReferralsManager'

export const metadata: Metadata = { title: 'Referrals | Staff' }
export const dynamic = 'force-dynamic'

interface SP { searchParams?: Promise<Record<string, string | undefined>> }

export default async function ReferralsPage({ searchParams }: SP) {
  await requireStaff()
  const sp = (await searchParams) ?? {}
  const status = sp.status as 'PENDING' | 'QUALIFIED' | 'DISQUALIFIED' | undefined
  const minFraud = sp.minFraud ? parseInt(sp.minFraud, 10) : undefined

  const referrals = await prismaUnfiltered.referral.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(minFraud != null ? { fraudScore: { gte: minFraud } } : {}),
    },
    orderBy: [{ fraudScore: 'desc' }, { createdAt: 'desc' }],
    take: 200,
    include: {
      referrer: { select: { id: true, email: true, isAmbassador: true, profile: { select: { firstName: true, lastName: true } } } },
      referee: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
            Referrals
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Review, disqualify, and manage referral fraud. Filter by status or minimum fraud score.
          </p>
        </div>
        <a
          href="/staff/referrals/payouts"
          className="rounded-lg bg-aerojet-blue px-3 py-2 text-sm font-bold text-white hover:bg-aerojet-blue/90"
        >
          Open payout queue →
        </a>
      </div>

      <ReferralsManager
        initialReferrals={referrals.map((r) => ({
          id: r.id,
          status: r.status,
          fraudScore: r.fraudScore,
          fraudReasons: r.fraudReasons,
          createdAt: r.createdAt.toISOString(),
          reviewedAt: r.reviewedAt?.toISOString() ?? null,
          referrer: {
            id: r.referrer.id,
            email: r.referrer.email,
            isAmbassador: r.referrer.isAmbassador,
            name: r.referrer.profile ? `${r.referrer.profile.firstName} ${r.referrer.profile.lastName}` : r.referrer.email,
          },
          referee: {
            id: r.referee.id,
            email: r.referee.email,
            name: r.referee.profile ? `${r.referee.profile.firstName} ${r.referee.profile.lastName}` : r.referee.email,
          },
        }))}
        currentFilters={{ status: status ?? null, minFraud: minFraud ?? null }}
      />
    </div>
  )
}
