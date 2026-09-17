import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { requireExaminer } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'
import type { ExamSitting } from '@prisma/client'
import ExaminerDashboard from '../staff/_components/ExaminerDashboard'

export const metadata: Metadata = { title: 'Examiner Dashboard | Examiner Portal' }

// S-3: the examiner's sitting list is rarely-changing reference data — cache it.
const getExaminerDashboardSittings = (userId: string) =>
  unstable_cache(
    async () => {
      const data = await prismaUnfiltered.examiner.findUnique({
        where: { userId },
        include: {
          sittings: {
            include: { event: true, examComponent: { include: { course: { select: { code: true, name: true } } } } },
            orderBy: { startTime: 'desc' },
          },
        },
      })
      return data?.sittings ?? []
    },
    ['examiner-dashboard-sittings', userId],
    { revalidate: 120, tags: ['examiner-dashboard', `examiner-${userId}`] }
  )()

export default async function ExaminerDashboardPage() {
  const user = await requireExaminer()

  const sittings = (await getExaminerDashboardSittings(user.id)) as ExamSitting[]
  const nextSitting = sittings.find((s) => new Date(s.startTime) >= new Date())
  const recentSittings = sittings.filter((s) => new Date(s.startTime) < new Date()).slice(0, 5)

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <ExaminerDashboard
        examinerName={user.name || 'Examiner'}
        nextSitting={serializePrisma(nextSitting)}
        recentSittings={serializePrisma(recentSittings)}
      />
    </div>
  )
}
