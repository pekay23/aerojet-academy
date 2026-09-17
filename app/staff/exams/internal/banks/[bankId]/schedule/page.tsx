import { requireStaff } from '@/lib/auth/helpers'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import ClassSchedulePage from './_components/ClassSchedulePage'

interface PageProps {
  params: Promise<{ bankId: string }>
}

export default async function StaffClassSchedulePage({ params }: PageProps) {
  await requireStaff()

  if (!(await isInternalExamSystemEnabled())) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400">Internal exams are not currently available.</p>
      </div>
    )
  }

  const { bankId } = await params
  return <ClassSchedulePage bankId={bankId} />
}
