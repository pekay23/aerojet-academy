import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { EnrollmentStatus } from '@prisma/client'
import { NextResponse } from 'next/server'

/**
 * POST /api/staff/enrollments/batch
 *
 * Batch-enrolls selected students into selected courses for a specific academic period.
 * Creates Enrollment records with status ACTIVE for each student × course pair.
 * Skips duplicates (students already enrolled in the course).
 *
 * Body: { studentIds: string[], courseIds: string[], academicYearId?: string, semesterId?: string }
 */
export async function POST(req: Request) {
  const session = await getAuthSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'STAFF']
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { studentIds, courseIds, academicYearId, semesterId } = body

    if (!studentIds?.length || !courseIds?.length) {
      return NextResponse.json(
        { error: 'At least one student and one course are required.' },
        { status: 400 }
      )
    }

    // Validate students exist and are FULL_TIME
    const students = await prisma.user.findMany({
      where: {
        id: { in: studentIds },
        role: 'STUDENT',
        status: 'ACTIVE',
        studentProfile: { enrollmentType: 'FULL_TIME' },
      },
      select: { id: true },
    })

    const validStudentIds = students.map((s) => s.id)
    if (validStudentIds.length === 0) {
      return NextResponse.json({ error: 'No valid full-time students found.' }, { status: 400 })
    }

    // Validate courses exist and are active
    const courses = await prisma.course.findMany({
      where: {
        id: { in: courseIds },
        isActive: true,
      },
      select: { id: true },
    })

    const validCourseIds = courses.map((c) => c.id)
    if (validCourseIds.length === 0) {
      return NextResponse.json({ error: 'No valid active courses found.' }, { status: 400 })
    }

    // Build enrollment records
    const records = []
    for (const userId of validStudentIds) {
      for (const courseId of validCourseIds) {
        records.push({
          userId,
          courseId,
          status: EnrollmentStatus.ACTIVE,
          academicYearId: academicYearId || null,
          semesterId: semesterId || null,
          approvedAt: new Date(),
        })
      }
    }

    // Batch insert, skipping duplicates (unique constraint: userId + courseId)
    const result = await prisma.enrollment.createMany({
      data: records,
      skipDuplicates: true,
    })

    return NextResponse.json({
      created: result.count,
      skipped: records.length - result.count,
      total: records.length,
    })
  } catch (error) {
    console.error('[BATCH_ENROLL]', error)
    return NextResponse.json({ error: 'Failed to process batch enrollment.' }, { status: 500 })
  }
}
