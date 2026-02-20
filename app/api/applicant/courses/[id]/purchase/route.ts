import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireApplicant } from '@/lib/auth/helpers'
import { apiCreated, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import crypto from 'crypto'

export const POST = withErrorHandler(
  async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
    const user = await requireApplicant()
    const courseId = ctx?.params?.id
    if (!courseId) return apiError('Course ID required')
    const body = await req.json()
    const { proofUrl } = body

    const course = await prisma.course.findUnique({ where: { id: courseId, isActive: true } })
    if (!course) return apiNotFound('Course not found')

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    })
    if (existing) return apiError('Already enrolled in this course')

    const referenceCode = `PAY-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

    const result = await prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.create({
        data: { userId: user.id, courseId, status: 'PENDING' },
      })
      const payment = await tx.payment.create({
        data: {
          userId: user.id,
          referenceType: 'COURSE_FEE',
          referenceCode,
          amount: course.price,
          currency: course.currency,
          paymentMethod: 'BANK_TRANSFER',
          proofUrl: proofUrl || null,
        },
      })
      return { enrollment, payment }
    })

    await createAuditLog({
      action: AuditAction.CREATE,
      entity: 'Enrollment',
      entityId: result.enrollment.id,
      userId: user.id,
      details: { courseCode: course.code },
    })
    return apiCreated({
      message: 'Enrollment submitted. Payment pending approval.',
      enrollmentId: result.enrollment.id,
      paymentReference: referenceCode,
    })
  }
)
