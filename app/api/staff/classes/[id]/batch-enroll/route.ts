import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered as prisma } from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { z } from 'zod'

const batchSchema = z.object({
  cohortId: z.string().cuid(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const json = await req.json()
    const result = batchSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid cohort selected' }, { status: 400 })
    }

    // Get class details
    const cls = await prisma.class.findUnique({
      where: { id },
    })

    if (!cls) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Get students in the cohort who are ACTIVE
    const students = await prisma.studentProfile.findMany({
      where: {
        academicYearId: result.data.cohortId,
        user: { status: 'ACTIVE' },
      },
      select: { userId: true },
    })

    if (students.length === 0) {
      return NextResponse.json(
        { error: 'No active students found in this cohort' },
        { status: 400 }
      )
    }

    // Get currently enrolled students
    const existingRecords = await prisma.attendanceRecord.findMany({
      where: { classId: id },
      distinct: ['userId'],
      select: { userId: true },
    })

    const existingIds = new Set(existingRecords.map((r) => r.userId))

    // Filter to only new students
    const newStudents = students.filter((s) => !existingIds.has(s.userId))

    if (newStudents.length === 0) {
      return NextResponse.json(
        { error: 'All students in this cohort are already enrolled' },
        { status: 400 }
      )
    }

    // Capacity check
    const currentOccupancy = existingIds.size
    const projectedOccupancy = currentOccupancy + newStudents.length

    if (projectedOccupancy > cls.maxStudents) {
      return NextResponse.json(
        {
          error: `Cannot enroll cohort. Adding ${newStudents.length} students would exceed class capacity of ${cls.maxStudents} (currently at ${currentOccupancy}).`,
        },
        { status: 400 }
      )
    }

    // Enroll students (create an initial attendance record or enrollment mapping)
    // Here we use attendance records as a proxy for roster membership
    // as per existing schema structure for classes.
    const recordsToCreate = newStudents.map((student) => ({
      classId: id,
      userId: student.userId,
      date: new Date(),
      status: 'RECORDED' as const,
      notes: 'Batch Enrolled',
    }))

    await prisma.attendanceRecord.createMany({
      data: recordsToCreate,
      skipDuplicates: true,
    })

    // Update currentStudents count
    await prisma.class.update({
      where: { id },
      data: { currentStudents: projectedOccupancy },
    })

    return NextResponse.json({ success: true, addedCount: newStudents.length })
  } catch (error: unknown) {
    console.error('[BATCH_ENROLL]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
