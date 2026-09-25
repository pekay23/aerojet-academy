import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect, notFound } from 'next/navigation'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { prismaUnfiltered } from '@/lib/prisma/client'
import PreExamForm from './_components/PreExamForm'

export const metadata: Metadata = { title: 'Exam Registration | Student' }
export const dynamic = 'force-dynamic'

export default async function ExamRegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>
  searchParams: Promise<{ code?: string }>
}) {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'STUDENT') return await redirectToLogin()
  if (!(await isInternalExamSystemEnabled())) redirect('/student/exams?tab=records')

  const { sessionId } = await params
  const { code } = await searchParams

  if (code) {
    const accessCode = await prismaUnfiltered.internalExamAccessCode.findUnique({
      where: { code },
      select: { id: true, sessionId: true, used: true, expiresAt: true, candidateId: true },
    })

    if (!accessCode || accessCode.sessionId !== sessionId) {
      notFound()
    }
    if (accessCode.used) {
      redirect('/student/exams?tab=records&error=code-used')
    }
    if (accessCode.expiresAt < new Date()) {
      redirect('/student/exams?tab=records&error=code-expired')
    }
    if (accessCode.candidateId && accessCode.candidateId !== session.user.id) {
      redirect('/student/exams?tab=records&error=code-mismatch')
    }
  } else {
    const validCode = await prismaUnfiltered.internalExamAccessCode.findFirst({
      where: {
        sessionId,
        candidateId: session.user.id,
        used: true,
        expiresAt: { gte: new Date() },
      },
      select: { id: true },
    })

    if (!validCode) {
      redirect('/student/exams?tab=records&error=no-access-code')
    }
  }

  const examSession = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id: sessionId },
    include: {
      bank: { select: { id: true, name: true } },
      class: {
        select: {
          id: true,
          name: true,
          classroom: { select: { name: true } },
        },
      },
    },
  })

  if (!examSession) {
    notFound()
  }

  const examDate = examSession.expiresAt ? new Date(examSession.expiresAt) : null
  const examLocation = examSession.class?.classroom?.name || examSession.class?.name || 'TBC'

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <PreExamForm sessionId={sessionId} examDate={examDate} examLocation={examLocation} />
    </div>
  )
}
