import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: studentId } = await params

    // Find the student
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        wallet: true,
      },
    })

    if (!student || !student.wallet) {
      return NextResponse.json({ error: 'Student or wallet not found' }, { status: 404 })
    }

    // Get wallet transactions
    const transactions = await prisma.walletTransaction.findMany({
      where: { walletId: student.wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Failed to fetch wallet transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallet transactions' },
      { status: 500 }
    )
  }
}
