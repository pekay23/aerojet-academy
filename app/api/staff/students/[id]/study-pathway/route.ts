import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { createAuditLog } from '@/lib/audit/logger'
import { triggerAutoEnrollmentIfRequired } from '@/lib/enrollment/engine'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff()
  const { id } = await params

  try {
    const { pathwayCode, reason } = await req.json()

    if (!pathwayCode || typeof pathwayCode !== 'string') {
      return NextResponse.json({ error: 'Pathway code is required' }, { status: 400 })
    }

    if (!reason || reason.length < 5) {
      return NextResponse.json(
        { error: 'A valid reason is required for administrative override' },
        { status: 400 }
      )
    }

    // Validate the pathway exists
    const pathway = await prismaUnfiltered.studyPathwayModel.findUnique({ where: { code: pathwayCode } })
    if (!pathway) {
      return NextResponse.json({ error: 'Invalid pathway code' }, { status: 400 })
    }

    const targetUser = await prismaUnfiltered.user.findUnique({
      where: { id },
      include: { studentProfile: { select: { id: true, pathwayId: true } } },
    })

    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    let studentProfileId: string

    await prismaUnfiltered.$transaction(async (tx) => {
      const profileData = {
        pathwayId: pathway.id,
        studyPathwayLockedAt: new Date(),
        studyPathwayLocked: true,
        studyPathwayLastChangedBy: staff.id,
        studyPathwayChangeReason: reason,
      }

      if (targetUser.studentProfile) {
        studentProfileId = targetUser.studentProfile.id
        await tx.studentProfile.update({
          where: { userId: id },
          data: profileData,
        })
      } else {
        const { generateStudentId } = await import('@/lib/auth/helpers')
        const created = await tx.studentProfile.create({
          data: {
            userId: id,
            studentId: await generateStudentId(),
            ...profileData,
          },
        })
        studentProfileId = created.id
      }
    })

    // Trigger auto-enrollment if the new pathway requires it
    await triggerAutoEnrollmentIfRequired(studentProfileId!)

    await createAuditLog({
      action: 'USER_UPDATE',
      entity: 'student_profiles',
      entityId: id,
      userId: staff.id,
      details: {
        oldPathwayId: targetUser.studentProfile?.pathwayId,
        newPathwayId: pathway.id,
        newPathwayCode: pathwayCode,
      },
      description: `Admin updated study pathway to ${pathwayCode}. Reason: ${reason}`,
    })

    return NextResponse.json({
      success: true,
      pathwayCode,
      message: 'Pathway updated',
    })
  } catch (error: unknown) {
    console.error('Pathway override error:', error)
    return NextResponse.json({ error: 'Failed to update pathway' }, { status: 500 })
  }
}
