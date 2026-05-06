import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const actorId = session.user.id
  const { reason } = await req.json()

  if (!reason?.trim()) {
    return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
  }

  const user = await prismaUnfiltered.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  await prismaUnfiltered.user.update({
    where: { id },
    data: { status: 'ARCHIVED' },
  })

  // Reject any pending registration payment
  await prismaUnfiltered.payment.updateMany({
    where: { userId: id, status: 'PENDING', referenceType: 'REGISTRATION' },
    data: {
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectedBy: actorId,
      rejectionReason: reason,
    },
  })

  await createAuditLog({
    action: 'APPLICANT_REJECTED',
    entity: 'users',
    entityId: id,
    userId: actorId,
    description: `Applicant rejected: ${user.email}. Reason: ${reason}`,
  })

  return NextResponse.json({ success: true })
}