import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import InternalExamInterface from '../_components/InternalExamInterface'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'

export const metadata: Metadata = { title: 'Exam In Progress | Student' }
export const dynamic = 'force-dynamic'

export default async function ExamSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'STUDENT') redirect('/login')
  if (!(await isInternalExamSystemEnabled())) redirect('/student/exams?tab=records')
  const { sessionId } = await params

  return <InternalExamInterface sessionId={sessionId} />
}
