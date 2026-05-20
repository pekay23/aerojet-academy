import { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { seedDefaultRetentionPolicies } from '@/lib/gdpr/retention'
import RetentionEditor from './_components/RetentionEditor'

export const metadata: Metadata = { title: 'Retention Policies | Staff' }
export const dynamic = 'force-dynamic'

export default async function RetentionPage() {
  await requireAdmin()
  await seedDefaultRetentionPolicies()

  const policies = await prismaUnfiltered.retentionPolicy.findMany({
    orderBy: { entity: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
          Retention Policies
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Configure how long each entity is retained before the weekly GDPR sweep marks it deleted.
          Defaults: 7 years (AuditLog, Enrollment, Grade, ExamResult), 5 years (Wallet, Payment,
          Refund, Withdrawal), 3 years (Notification, Message).
        </p>
      </div>

      <RetentionEditor
        policies={policies.map((p) => ({
          id: p.id,
          entity: p.entity,
          retentionDays: p.retentionDays,
          anchor: p.anchor,
          isActive: p.isActive,
          description: p.description,
          updatedAt: p.updatedAt.toISOString(),
        }))}
      />
    </div>
  )
}
