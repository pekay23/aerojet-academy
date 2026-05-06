import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Get the payment to find the corresponding user ID and reference type
  const payment = await prismaUnfiltered.payment.findUnique({
    where: { id },
  })

  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  // Fetch all file uploads for this user that are likely payment proofs
  const uploads = await prismaUnfiltered.fileUpload.findMany({
    where: {
      userId: payment.userId,
      fileType: 'PaymentProof',
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return NextResponse.json({ uploads })
}
