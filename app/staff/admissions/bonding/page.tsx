import { Metadata } from 'next'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'
import BondingContractsTable from './_components/BondingContractsTable'

export const metadata: Metadata = { title: 'Bonding Contracts | Admissions' }
export const dynamic = 'force-dynamic'

export default async function BondingContractsPage() {
  await requireStaff()

  const [contracts, total, statusCounts] = await Promise.all([
    prismaUnfiltered.bondingContract.findMany({
      include: {
        application: {
          select: {
            programmeChoice: true,
            fundingType: true,
            user: {
              select: {
                id: true,
                email: true,
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        studentProfile: {
          select: { studentId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prismaUnfiltered.bondingContract.count(),
    prismaUnfiltered.bondingContract.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
  ])

  const counts: Record<string, number> = {}
  for (const s of statusCounts) {
    counts[s.status] = s._count.status
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
          Bonding Contracts
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Track and manage bonding contracts for scholarship-funded students.
        </p>
      </div>

      <BondingContractsTable
        initialContracts={serializePrisma(contracts)}
        initialTotal={total}
        statusCounts={counts}
      />
    </div>
  )
}
