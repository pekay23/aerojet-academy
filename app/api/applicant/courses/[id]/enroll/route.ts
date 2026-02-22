import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireApplicant } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'

export const POST = withErrorHandler(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const user = await requireApplicant()
    const { id: courseId } = params
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
      await tx.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: course.id,
          },
        },
        update: {
          status: 'PENDING',
          paymentProofUrl: proofUrl,
          amountPaid: course.price,
        },
        create: {
          userId: user.id,
          courseId: course.id,
          status: 'PENDING',
          paymentProofUrl: proofUrl,
          amountPaid: course.price,
        },
      })

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

    return apiSuccess({ message: 'Enrollment request and payment proof submitted.' })
  }
)
