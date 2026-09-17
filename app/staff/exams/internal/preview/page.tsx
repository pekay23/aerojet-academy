import { Metadata } from 'next'
import { requireStaff } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import ExamPreviewClient from './_components/ExamPreviewClient'

export const metadata: Metadata = { title: 'Internal Exam Preview | Staff' }
export const dynamic = 'force-dynamic'

export default async function InternalExamPreviewPage() {
  await requireStaff()

  const banks = await prismaUnfiltered.internalExamBank.findMany({
    include: { course: { select: { id: true, name: true, code: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const bankOptions = banks.map((b) => ({
    id: b.id,
    name: b.name,
    courseCode: b.course.code,
    courseName: b.course.name,
    mcqCount: b.mcqCount,
    categoryCode: null,
    sebConfig: null,
    sebRequired: false,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-aerojet-blue text-2xl font-black tracking-tight sm:text-3xl dark:text-white">
          Internal Exam Preview
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          Preview EASA-style module exams exactly as students will see them. Answers are shown for
          review.
        </p>
      </div>

      <ExamPreviewClient banks={bankOptions} />
    </div>
  )
}
