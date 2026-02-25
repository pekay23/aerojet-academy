import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const staff = session.user as any
  if (!['STAFF', 'ADMIN'].includes(staff.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  try {
    const { studyPathway, reason } = await req.json()

    if (!['FULL_TIME', 'EXAM_ONLY', 'MODULAR'].includes(studyPathway)) {
      return NextResponse.json({ error: 'Invalid study pathway selected' }, { status: 400 })
    }

    if (!reason || reason.length < 5) {
      return NextResponse.json(
        { error: 'A valid reason is required for administrative override' },
        { status: 400 }
      )
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { studentProfile: true },
    })

    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    await prisma.$transaction(async (tx) => {
      // Create or update StudentProfile
      if (targetUser.studentProfile) {
        await tx.studentProfile.update({
          where: { userId: id },
          data: {
            studyPathway,
            studyPathwayLockedAt: new Date(),
            studyPathwayLocked: true,
            studyPathwayLastChangedBy: staff.id,
            studyPathwayChangeReason: reason,
          },
        })
      } else {
        const { generateStudentId } = await import('@/lib/auth/helpers')
        await tx.studentProfile.create({
          data: {
            userId: id,
            studentId: generateStudentId(),
            studyPathway,
            studyPathwayLockedAt: new Date(),
            studyPathwayLocked: true,
            studyPathwayLastChangedBy: staff.id,
            studyPathwayChangeReason: reason,
          },
        })
      }
    })

    await createAuditLog({
      action: 'USER_UPDATE' as any,
      entity: 'student_profiles',
      entityId: id,
      userId: staff.id,
      details: {
        oldPathway: targetUser.studentProfile?.studyPathway,
        newPathway: studyPathway,
      },
      description: `Admin forced study pathway changed to ${studyPathway}. Reason: ${reason}`,
    })

    return NextResponse.json({
      success: true,
      studyPathway,
      message: 'Pathway forcefully updated',
    })
  } catch (error: any) {
    console.error('Pathway override error:', error)
    return NextResponse.json({ error: 'Failed to process pathway override' }, { status: 500 })
  }
}
