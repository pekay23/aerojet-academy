import { requireStaff } from '@/lib/auth/helpers'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { prismaUnfiltered } from '@/lib/prisma/client'
import InstructorAssignmentPage from './_components/InstructorAssignmentPage'

interface PageProps {
  params: Promise<{ bankId: string }>
}

export default async function StaffInstructorAssignmentPage({ params }: PageProps) {
  await requireStaff()

  if (!(await isInternalExamSystemEnabled())) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400">Internal exams are not currently available.</p>
      </div>
    )
  }

  const { bankId } = await params

  const bank = await prismaUnfiltered.internalExamBank.findFirst({
    where: { id: bankId },
    include: { course: { select: { id: true, code: true, name: true } } },
  })

  if (!bank) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400">Bank not found.</p>
      </div>
    )
  }

  return <InstructorAssignmentPage bankId={bankId} bankName={bank.name} courseCode={bank.course.code} courseId={bank.course.id} />
}
