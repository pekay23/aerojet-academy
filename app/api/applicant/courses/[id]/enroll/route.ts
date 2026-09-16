import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireApplicant } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
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
    await prisma.$transaction(async (tx) => {
      // 1. Create or Update Enrollment
      const existingEnrollment = await tx.enrollment.findFirst({
        where: { userId: user.id, courseId: course.id },
      })
      if (existingEnrollment) {
        await tx.enrollment.update({
          where: { id: existingEnrollment.id },
          data: {
            status: 'PENDING',
            paymentProofUrl: proofUrl,
            amountPaid: course.price,
          },
        })
      } else {
        await tx.enrollment.create({
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
      await tx.payment.create({
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
    })

    // Get the enrollment ID for tracking
    const enrollment = await prisma.enrollment.findFirst({
      where: { userId: user.id, courseId: course.id },
      select: { id: true },
    })

    // Analytics tracking (non-blocking)
    if (enrollment) {
      trackEnrollment(enrollment.id, course.id, course.code, user.id).catch(console.error)
    }

    return apiSuccess({ message: 'Enrollment request and payment proof submitted.' })
  }
)
