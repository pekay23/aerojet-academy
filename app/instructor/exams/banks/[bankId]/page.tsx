import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireInstructor } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { parsePagination } from '@/lib/api/response'
import BankManager from './_components/BankManager'

export const metadata: Metadata = { title: 'Question Bank | Instructor Portal' }
export const dynamic = 'force-dynamic'

export interface BankQuestion {
  id: string
  text: string
  status: string
  difficulty: string
  options: unknown
  correctAnswer: string
  points: number
  submittedBy?: { id: string; name: string | null; profile?: { firstName: string | null; lastName: string | null } | null } | null
}

export default async function BankPage({
  params,
  searchParams,
}: {
  params: Promise<{ bankId: string }>
  searchParams: Promise<{ page?: string; limit?: string }>
}) {
  const user = await requireInstructor()
  const instructorProfile = await getInstructorProfileByUserId(user.id)
  if (!instructorProfile) notFound()

  const { bankId } = await params
  const sp = await searchParams
  const { page, limit, skip } = parsePagination(new URLSearchParams(sp as Record<string, string>))

  const bank = await prismaUnfiltered.internalExamBank.findUnique({
    where: { id: bankId },
    include: {
      course: { select: { id: true, name: true, code: true } },
      _count: {
        select: {
          questions: { where: { status: 'APPROVED', isActive: true } },
          sessions: true,
        },
      },
    },
  })
  if (!bank) notFound()

  const assignment = await prismaUnfiltered.internalExamBankInstructor.findUnique({
    where: { bankId_instructorId: { bankId, instructorId: instructorProfile.id } },
  })
  if (!assignment) notFound()

  if (!(await isInternalExamSystemEnabled())) {
    return (
      <div className="mx-auto max-w-3xl pb-10">
        <BankManager bankId={bankId} bankName={bank.name} courseName={bank.course.name} disabled questions={[]} total={0} page={1} limit={limit} />
      </div>
    )
  }

  const [rawQuestions, total, pendingCount] = await Promise.all([
    prismaUnfiltered.internalExamQuestion.findMany({
      where: { bankId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    prismaUnfiltered.internalExamQuestion.count({ where: { bankId } }),
    prismaUnfiltered.internalExamQuestion.count({ where: { bankId, status: 'PENDING_APPROVAL', isActive: true } }),
  ])

  const authorIds = Array.from(
    new Set(rawQuestions.map((q) => q.submittedById).filter((id): id is string => Boolean(id)))
  )
  const authors = authorIds.length
    ? await prismaUnfiltered.user.findMany({
        where: { id: { in: authorIds } },
        select: { id: true, name: true, profile: { select: { firstName: true, lastName: true } } },
      })
    : []
  const authorMap = new Map(authors.map((a) => [a.id, a]))
  const questions = rawQuestions.map((q) => ({
    ...q,
    submittedBy: q.submittedById ? authorMap.get(q.submittedById) ?? null : null,
  }))

  const requiredMinimum = bank.minimumPoolSize ?? bank.mcqCount * 5
  const ratio = requiredMinimum > 0 ? bank._count.questions / requiredMinimum : 0
  const poolHealth = ratio >= 1 ? 'GREEN' : ratio >= 0.6 ? 'AMBER' : 'RED'

  return (
    <div className="mx-auto max-w-5xl pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <BankManager
        bankId={bankId}
        bankName={bank.name}
        courseName={bank.course.name}
        courseCode={bank.course.code}
        approvedCount={bank._count.questions}
        requiredMinimum={requiredMinimum}
        pendingCount={pendingCount}
        poolHealth={poolHealth}
        questions={questions as unknown as BankQuestion[]}
        total={total}
        page={page}
        limit={limit}
        disabled={false}
      />
    </div>
  )
}
