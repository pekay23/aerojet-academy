import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = (session.user as any).id

  try {
    const { studyPathway } = await req.json()

    if (!['FULL_TIME', 'EXAM_ONLY', 'MODULAR'].includes(studyPathway)) {
      return NextResponse.json({ error: 'Invalid study pathway selected' }, { status: 400 })
    }

    // Check if a pathway is already locked
    const existingProfile = await prisma.studentProfile.findUnique({
      where: { userId },
      select: { studyPathway: true },
    })

    if (existingProfile?.studyPathway) {
      return NextResponse.json(
        { error: 'Study pathway is already locked and cannot be changed' },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      // 1. Create or update StudentProfile
      if (existingProfile) {
        await tx.studentProfile.update({
          where: { userId },
          data: {
            studyPathway,
            studyPathwayLockedAt: new Date(),
            studyPathwayLocked: true,
          },
        })
      } else {
        // If they are an APPLICANT, they might not have a profile yet until this point
        const { generateStudentId } = await import('@/lib/auth/helpers')
        await tx.studentProfile.create({
          data: {
            userId,
            studentId: generateStudentId(),
            studyPathway,
            studyPathwayLockedAt: new Date(),
            studyPathwayLocked: true,
          },
        })
      }

      // 2. Ensure they have a Wallet
      const existingWallet = await tx.wallet.findUnique({ where: { userId } })
      if (!existingWallet) {
        await tx.wallet.create({
          data: {
            userId,
            balance: 0,
            reservedBalance: 0,
            availableBalance: 0,
            currency: 'EUR',
          },
        })
      }
    })

    await createAuditLog({
      action: 'PATHWAY_SETUP',
      entity: 'student_profiles',
      entityId: userId,
      userId,
      description: `Student chose ${studyPathway} pathway. Locked.`,
    })

    return NextResponse.json({
      success: true,
      studyPathway,
      lockedAt: new Date(),
      message: 'Pathway locked. You cannot change this.',
    })
  } catch (error: any) {
    console.error('Pathway selection error:', error)
    return NextResponse.json({ error: 'Failed to process pathway selection' }, { status: 500 })
  }
}
