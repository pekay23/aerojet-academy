import { Metadata } from 'next'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import PayoutsManager from './_components/PayoutsManager'

export const metadata: Metadata = { title: 'Referral Payouts | Staff' }
export const dynamic = 'force-dynamic'

export default async function PayoutsPage() {
  await requireStaff()

  const payouts = await prismaUnfiltered.referralPayout.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 100,
  })

  const referrerIds = Array.from(new Set(payouts.map((p) => p.referrerId)))
  const referrers = await prismaUnfiltered.user.findMany({
    where: { id: { in: referrerIds } },
    select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } },
  })
  const referrerMap = new Map(referrers.map((r) => [r.id, r]))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
          Referral Payouts
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Create a payout run for a period, approve PENDING payouts, mark them paid, and export a CSV.
        </p>
      </div>

      <PayoutsManager
        payouts={payouts.map((p) => {
          const u = referrerMap.get(p.referrerId)
          return {
            id: p.id,
            referrerId: p.referrerId,
            referrerName: u?.profile ? `${u.profile.firstName} ${u.profile.lastName}` : (u?.email ?? p.referrerId),
            referrerEmail: u?.email ?? '',
            amount: Number(p.amount),
            currency: p.currency,
            periodStart: p.periodStart.toISOString(),
            periodEnd: p.periodEnd.toISOString(),
            status: p.status,
            paidAt: p.paidAt?.toISOString() ?? null,
            notes: p.notes,
          }
        })}
      />
    </div>
  )
}
