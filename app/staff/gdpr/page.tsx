import { Metadata } from 'next'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { seedDefaultRetentionPolicies } from '@/lib/gdpr/retention'
import GdprQueue from './_components/GdprQueue'

export const metadata: Metadata = { title: 'Data Protection Requests | Staff' }
export const dynamic = 'force-dynamic'

export default async function GdprQueuePage() {
  await requireStaff()
  // Seed retention defaults on first visit so admins always have something to edit.
  await seedDefaultRetentionPolicies()

  const requests = await prismaUnfiltered.dataSubjectRequest.findMany({
    orderBy: [{ status: 'asc' }, { dueBy: 'asc' }],
    take: 200,
    include: {
      user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
      assignedTo: { select: { id: true, email: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
          Data Protection Requests
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Data-subject access, erasure, rectification, restriction, portability, and objection
          requests under Ghana Act 843 and other applicable privacy obligations. The{' '}
          <code>dueBy</code> column enforces the internal response SLA.
        </p>
      </div>

      <GdprQueue
        requests={requests.map((r) => ({
          id: r.id,
          requestType: r.requestType,
          status: r.status,
          requestedAt: r.requestedAt.toISOString(),
          dueBy: r.dueBy.toISOString(),
          completedAt: r.completedAt?.toISOString() ?? null,
          notes: r.notes,
          decisionReason: r.decisionReason,
          user: {
            id: r.user.id,
            email: r.user.email,
            name: r.user.profile ? `${r.user.profile.firstName} ${r.user.profile.lastName}` : r.user.email,
          },
          assignedToEmail: r.assignedTo?.email ?? null,
        }))}
      />
    </div>
  )
}
