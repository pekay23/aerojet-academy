import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const staff = session.user as any
  if (!['STAFF', 'ADMIN'].includes(staff.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  try {
    const { academicYearId, semesterId } = await req.json()

    // Validate: can't have semester without academic year
    if (semesterId && !academicYearId) {
      return NextResponse.json(
        { error: 'Cannot assign a semester without an academic year' },
        { status: 400 }
      )
    }

    // Validate semester belongs to the chosen academic year
    if (semesterId && academicYearId) {
      const semester = await prisma.semester.findUnique({
        where: { id: semesterId },
        select: { academicYearId: true },
      })
      if (!semester || semester.academicYearId !== academicYearId) {
        return NextResponse.json(
          { error: 'Selected semester does not belong to the chosen academic year' },
          { status: 400 }
        )
      }
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: { studentProfile: { select: { id: true, academicYearId: true, semesterId: true } } },
    })

    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (!targetUser.studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    await prisma.studentProfile.update({
      where: { userId: id },
      data: {
        academicYearId: academicYearId || null,
        semesterId: semesterId || null,
      },
    })

    await createAuditLog({
      action: 'USER_UPDATE',
      entity: 'student_profiles',
      entityId: id,
      userId: staff.id,
      details: {
        oldAcademicYearId: targetUser.studentProfile.academicYearId,
        oldSemesterId: targetUser.studentProfile.semesterId,
        newAcademicYearId: academicYearId,
        newSemesterId: semesterId,
      },
      description: `Admin updated student academic period`,
    })

    return NextResponse.json({ success: true, message: 'Academic period updated' })
  } catch (error: any) {
    console.error('Academic period update error:', error)
    return NextResponse.json({ error: 'Failed to update academic period' }, { status: 500 })
  }
}
