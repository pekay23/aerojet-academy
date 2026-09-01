import { Metadata } from 'next'
import { requireStaff } from '@/lib/auth/helpers'
import { requirePermission } from '@/lib/auth/permissions'
import { PERMISSIONS } from '@/lib/auth/permissions'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { notFound } from 'next/navigation'
import SupervisedExamInterface from './_components/SupervisedExamInterface'

export const metadata: Metadata = {
  title: 'Supervised Exam | Staff',
}

export const dynamic = 'force-dynamic'

export default async function SupervisedExamPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireStaff()
  await requirePermission(PERMISSIONS.EXAM_SESSION_SUPERVISE)

  const { id } = await params

  const session = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id },
    include: {
      bank: { select: { id: true, name: true } },
      student: { select: { id: true, firstName: true, lastName: true, email: true } },
      class: { select: { id: true, name: true } },
    },
  })

  if (!session || !session.supervised) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SupervisedExamInterface
        sessionId={id}
        studentName={`${session.student.firstName} ${session.student.lastName}`}
        studentEmail={session.student.email}
        bankName={session.bank.name}
        className={session.class?.name}
      />
    </div>
  )
}
