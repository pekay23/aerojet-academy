import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { joinPool } from '@/lib/pools/join'
import { validatePoolJoin } from '@/lib/pools/validation'
import { promoteToStudent } from '@/lib/students/promotion'

export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const { poolId, moduleCode } = await request.json()

    if (!poolId || !moduleCode) {
      return NextResponse.json({ error: 'Pool ID and module code are required' }, { status: 400 })
    }

    // Resolve exam component from module code
    const examComponent = await prisma.examComponent.findFirst({
      where: {
        code: moduleCode,
      },
    })

    if (!examComponent) {
      return NextResponse.json(
        { error: `No exam component found for module ${moduleCode}` },
        { status: 404 }
      )
    }

    // Pre-validate before entering the transaction (fast-fail for UX)
    const validation = await validatePoolJoin(poolId, userId, examComponent.id)
    if (!validation.valid) {
      if (validation.error?.includes('Insufficient')) {
        const pool = await prisma.examPool.findUnique({ where: { id: poolId } })
        const wallet = await prisma.wallet.findUnique({ where: { userId } })
        return NextResponse.json(
          {
            error: 'INSUFFICIENT_BALANCE',
            required: Number(pool?.seatPrice || 300),
            available: Number(wallet?.availableBalance || 0),
          },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Use the atomic joinPool function with serializable isolation
    const result = await joinPool({
      poolId,
      userId,
      examComponentId: examComponent.id,
    })

    if (!result.success) {
      if (result.error?.includes('Insufficient') || result.error?.includes('balance')) {
        return NextResponse.json(
          { error: 'INSUFFICIENT_BALANCE', message: result.error },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Check if this is user's first booking — promote to student
    const existingMemberships = await prisma.poolMembership.count({
      where: { userId },
    })
    const existingExams = await prisma.examBooking.count({
      where: { userId },
    })

    let promotedToStudent = false
    if (existingMemberships === 1 && existingExams === 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })
      if (user && user.role === 'APPLICANT') {
        const promoResult = await promoteToStudent(userId, 'EXAM_ONLY')
        if (promoResult.success) {
          promotedToStudent = true
        }
      }
    }

    return NextResponse.json({
      success: true,
      membershipId: result.membership?.id,
      autoConfirmed: result.autoConfirmed,
      message: promotedToStudent
        ? 'Successfully joined booking and promoted to student!'
        : result.autoConfirmed
          ? 'Successfully joined booking — booking has been confirmed!'
          : 'Successfully joined booking',
      promotedToStudent,
    })
  } catch (error) {
    console.error('Error joining pool:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
