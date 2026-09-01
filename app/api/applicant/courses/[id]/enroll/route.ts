import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireApplicant } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { trackEnrollment, trackPaymentSubmitted } from '@/lib/analytics/events'
import { trackEnrollment } from '@/lib/analytics/events'

export const POST = withErrorHandler(
  async (req: NextRequest, ctx?: { params: Record<string, string> }) => {
    const user = await requireApplicant()
    const courseId = ctx?.params?.id
    const body = await req.json()
    const { proofUrl } = body

    if (!proofUrl) return apiError('Payment proof is required')

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course) return apiError('Course not found', 404)

    // Update enrollment and create payment record in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or Update Enrollment
      const existingEnrollment = await tx.enrollment.findFirst({
        where: { userId: user.id, courseId: course.id },
      })
      let enrollment
      if (existingEnrollment) {
        enrollment = await tx.enrollment.update({
          where: { id: existingEnrollment.id },
          data: {
            status: 'PENDING',
            paymentProofUrl: proofUrl,
            amountPaid: course.price,
          },
        })
      } else {
        enrollment = await tx.enrollment.create({
          data: {
            userId: user.id,
            courseId: course.id,
            status: 'PENDING',
            paymentProofUrl: proofUrl,
            amountPaid: course.price,
          },
        })
      }

      // 2. Create Payment Record
      const payment = await tx.payment.create({
        data: {
          userId: user.id,
          amount: course.price,
          currency: course.currency,
          paymentMethod: 'BANK_TRANSFER',
          status: 'PENDING',
          proofUrl,
          proofUploadedAt: new Date(),
          referenceType: 'COURSE',
          referenceId: course.id,
          referenceCode: `CRS-${course.code}-${user.id.slice(-6)}-${Date.now()}`,
          notes: `Enrollment payment for ${course.name} (${course.code})`,
        },
      })

      // Analytics tracking (non-blocking)
      if (enrollment) {
        trackEnrollment(enrollment.id, course.id, course.code, user.id).catch(() => {})
      }
      trackPaymentSubmitted(Number(payment.amount), payment.currency, payment.id, payment.userId, payment.paymentMethod).catch(() => {})

      return { enrollment, payment }
    })

    return apiSuccess({ message: 'Enrollment request and payment proof submitted.' })
  }
)
