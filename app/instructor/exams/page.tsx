import { Metadata } from 'next'
import { requireInstructor } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import InstructorExamsDashboard from './_components/InstructorExamsDashboard'

export const metadata: Metadata = { title: 'Internal Exams | Instructor Portal' }
export const dynamic = 'force-dynamic'

export interface ExamsDashboardCounts {
  myQuestions: number
  myBanks: number
  myClasses: number
  pendingReview: number
}

export default async function InstructorExamsPage() {
  const user = await requireInstructor()
  const instructorProfile = await getInstructorProfileByUserId(user.id)
  const internalExamEnabled = await isInternalExamSystemEnabled()

  let counts: ExamsDashboardCounts = { myQuestions: 0, myBanks: 0, myClasses: 0, pendingReview: 0 }

  if (internalExamEnabled && instructorProfile) {
    const [bankAssignmentRows, classIds, pendingReview] = await Promise.all([
      prismaUnfiltered.internalExamBankInstructor.findMany({
        where: { instructorId: instructorProfile.id },
        select: { bankId: true },
      }),
      prismaUnfiltered.class.findMany({
        where: { instructorId: instructorProfile.id },
        select: { id: true },
      }),
      prismaUnfiltered.internalExamQuestion.count({
        where: { submittedById: user.id, status: 'PENDING_APPROVAL', isActive: true },
      }),
    ])

    const bankIds = bankAssignmentRows.map((b) => b.bankId)
    const myQuestions = bankIds.length
      ? await prismaUnfiltered.internalExamQuestion.count({
          where: { bankId: { in: bankIds }, submittedById: user.id },
        })
      : 0
    const myBanks = await prismaUnfiltered.internalExamBank.count({ where: { id: { in: bankIds } } })

    counts = {
      myQuestions,
      myBanks,
      myClasses: classIds.length,
      pendingReview,
    }
  }

  return (
    <div className="mx-auto max-w-7xl pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <InstructorExamsDashboard
        instructorId={user.id}
        instructorName={user.name || user.email || ''}
        internalExamEnabled={internalExamEnabled}
        counts={counts}
      />
    </div>
  )
}
