import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { EnrollmentStatus } from '@prisma/client'
import { NextResponse } from 'next/server'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

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
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }
    const { studentIds, courseIds, academicYearId, semesterId } = body as {
      studentIds?: string[]
      courseIds?: string[]
      academicYearId?: string
      semesterId?: string
    }

    const MAX_STUDENTS = 200
    const MAX_COURSES = 100
    if ((studentIds?.length ?? 0) > MAX_STUDENTS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_STUDENTS} students allowed` },
        { status: 400 }
      )
    }
    if ((courseIds?.length ?? 0) > MAX_COURSES) {
      return NextResponse.json({ error: `Maximum ${MAX_COURSES} courses allowed` }, { status: 400 })
    }

    if (!studentIds?.length || !courseIds?.length) {
      return NextResponse.json(
        { error: 'At least one student and one course are required.' },
        { status: 400 }
      )
    }

    // Validate students exist and are FULL_TIME
    const students = await prismaUnfiltered.user.findMany({
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
    const courses = await prismaUnfiltered.course.findMany({
      where: {
        id: { in: courseIds },
        isActive: true,
      },
      select: { id: true, price: true },
    })

    const validCourseIds = courses.map((c) => c.id)
    if (validCourseIds.length === 0) {
      return NextResponse.json({ error: 'No valid active courses found.' }, { status: 400 })
    }

    const courseMap = new Map(courses.map((c) => [c.id, c]))
    const records = []
    for (const userId of validStudentIds) {
      for (const courseId of validCourseIds) {
        const course = courseMap.get(courseId)
        records.push({
          userId,
          courseId,
          status: EnrollmentStatus.ACTIVE,
          academicYearId: academicYearId || null,
          semesterId: semesterId || null,
          approvedAt: new Date(),
          amountPaid: course?.price || 0,
        })
      }
    }

    // Batch insert, skipping duplicates (unique constraint: userId + courseId)
    const result = await prismaUnfiltered.enrollment.createMany({
      data: records,
      skipDuplicates: true,
    })

    // Audit log the privileged mutation
    await createAuditLog({
      action: AuditAction.ENROLLMENT_APPROVE,
      userId: session.user.id,
      entity: 'Enrollment',
      entityId: undefined,
      description: `Batch enrolled ${result.count} students into ${validCourseIds.length} courses`,
      changes: {
        created: result.count,
        skipped: records.length - result.count,
        courseIds: validCourseIds,
        studentCount: validStudentIds.length,
        targetUserIds: validStudentIds,
      },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
      userAgent: req.headers.get('user-agent') ?? undefined,
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
