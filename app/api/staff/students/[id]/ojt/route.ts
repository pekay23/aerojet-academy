import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiCreated, withErrorHandler, RouteContext } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { serializePrisma } from '@/lib/utils/serialization'

// GET /api/staff/students/[id]/ojt — List OJT periods for a student
export const GET = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    await requireStaff()
    const userId = context?.params?.id
    if (!userId) return apiError('Student user ID required')

    const enrollments = await prismaUnfiltered.fullTimeEnrollment.findMany({
      where: { studentId: userId },
      include: {
        ojtPeriods: { orderBy: { startDate: 'desc' } },
        programme: { select: { code: true, name: true } },
      },
    })

    return apiSuccess(serializePrisma(enrollments))
  }
)

// POST /api/staff/students/[id]/ojt — Create an OJT period
export const POST = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const userId = context?.params?.id
    if (!userId) return apiError('Student user ID required')

    const body = await req.json()
    const { enrollmentId, companyName, companyAddress, supervisorName, supervisorEmail, startDate, hoursRequired } = body

    if (!enrollmentId || !companyName || !startDate) {
      return apiError('Enrollment ID, company name, and start date are required')
    }

    // Validate OJT access for the student
    const { allowed, error: validationError, severity } = await import('@/lib/enrollment/validation').then(v => 
      v.validateOjtAccess(userId)
    )

    const force = body.ignorePathwayRestrictions === true

    if (!allowed && !force) {
      return apiError(validationError || 'Student is not eligible for OJT.', 400, {
        needsOverride: severity === 'WARNING',
        warning: validationError
      })
    }

    const enrollment = await prismaUnfiltered.fullTimeEnrollment.findUnique({
      where: { id: enrollmentId, studentId: userId },
    })
    if (!enrollment) return apiError('Enrollment not found for this student', 404)

    const ojt = await prismaUnfiltered.ojtPeriod.create({
      data: {
        enrollmentId,
        companyName,
        companyAddress: companyAddress || null,
        supervisorName: supervisorName || null,
        supervisorEmail: supervisorEmail || null,
        startDate: new Date(startDate),
        hoursRequired: hoursRequired ? parseInt(hoursRequired) : 2000,
        status: 'PENDING',
      },
    })

    await createAuditLog({
      action: AuditAction.CREATE,
      entity: 'OjtPeriod',
      entityId: ojt.id,
      userId: staff.id,
      details: { studentUserId: userId, companyName },
    })

    return apiCreated(serializePrisma(ojt))
  }
)

// PATCH /api/staff/students/[id]/ojt — Update an OJT period
export const PATCH = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const body = await req.json()
    const { ojtId, status, hoursCompleted, endDate, notes } = body

    if (!ojtId) return apiError('OJT period ID required')

    const ojt = await prismaUnfiltered.ojtPeriod.findUnique({ where: { id: ojtId } })
    if (!ojt) return apiError('OJT period not found', 404)

    const updated = await prismaUnfiltered.ojtPeriod.update({
      where: { id: ojtId },
      data: {
        ...(status !== undefined && { status }),
        ...(hoursCompleted !== undefined && { hoursCompleted: parseInt(hoursCompleted) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(notes !== undefined && { notes }),
      },
    })

    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'OjtPeriod',
      entityId: ojtId,
      userId: staff.id,
      details: body,
    })

    return apiSuccess(serializePrisma(updated))
  }
)
