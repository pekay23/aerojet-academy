import { requireExaminer } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'
import ExaminerDashboard from '../staff/_components/ExaminerDashboard'

export default async function ExaminerDashboardPage() {
  const user = await requireExaminer()

  const examinerData = await prismaUnfiltered.examiner.findUnique({
    where: { userId: user.id },
    include: {
      sittings: {
        include: { event: true },
        orderBy: { startTime: 'desc' },
      },
    },
  })

  const sittings = (examinerData as any)?.sittings || []
  const nextSitting = sittings.find((s: any) => new Date(s.startTime) >= new Date())
  const recentSittings = sittings.filter((s: any) => new Date(s.startTime) < new Date()).slice(0, 5)

  return (
    <ExaminerDashboard 
      examinerName={user.name || 'Examiner'} 
      nextSitting={serializePrisma(nextSitting)}
      recentSittings={serializePrisma(recentSittings)}
    />
  )
}
