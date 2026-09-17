import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireApplicant, checkRateLimit } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiTooManyRequests, withErrorHandler , RouteContext } from '@/lib/api/response'
import { trackEnrollment, trackPaymentSubmitted } from '@/lib/analytics/events'

const ALLOWED_PROOF_HOSTNAMES = new Set([
  'utfs.io',
  'ufs.sh',
  'uploadthing.com',
  'www.uploadthing.com',
])

function isValidProofUrl(url: string): boolean {
  if (url.length > 2048) return false
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  if (parsed.protocol !== 'https:') return false
  return ALLOWED_PROOF_HOSTNAMES.has(parsed.hostname)
}

export const POST = withErrorHandler(
  async (req: NextRequest, ctx?: RouteContext) => {
    if (!checkRateLimit(`enroll:${(await requireApplicant()).id}`, 10, 60 * 60 * 1000)) {
      return apiTooManyRequests('Too many enrollment submissions. Please try again later.')
    }
    const user = await requireApplicant()
    const courseId = (await ctx!.params).id
    let body: { proofUrl?: unknown }
    try {
      body = await req.json()
    } catch {
      return apiError('Invalid JSON body', 400)
    }
    const { proofUrl } = body

    if (typeof proofUrl !== 'string' || !isValidProofUrl(proofUrl)) {
      return apiError('A valid HTTPS payment proof URL on an allowed host is required', 400)
    }

    const course = await prismaUnfiltered.course.findUnique({
      where: { id: courseId },
    })

    if (!course) return apiError('Course not found', 404)

    const referenceCode = `CRS-${course.code}-${user.id.slice(-6)}-${crypto.randomUUID().slice(0, 8)}`

    const { enrollment, payment } = await prismaUnfiltered.$transaction(async (tx) => {
      const existingEnrollment = await tx.enrollment.findFirst({
        where: { userId: user.id, courseId: course.id },
      })
      const enrollment = existingEnrollment
        ? await tx.enrollment.update({
            where: { id: existingEnrollment.id },
            data: {
              status: 'PENDING',
              paymentProofUrl: proofUrl,
              amountPaid: course.price,
            },
          })
        : await tx.enrollment.create({
            data: {
              userId: user.id,
              courseId: course.id,
              status: 'PENDING',
              paymentProofUrl: proofUrl,
              amountPaid: course.price,
            },
          })

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
          referenceCode,
          notes: `Enrollment payment for ${course.name} (${course.code})`,
        },
      })

      return { enrollment, payment }
    })

    trackEnrollment(enrollment.id, course.id, course.code, user.id).catch(() => {})
    trackPaymentSubmitted(
      Number(payment.amount),
      payment.currency,
      payment.id,
      payment.userId,
      payment.paymentMethod
    ).catch(() => {})

    return apiSuccess({ message: 'Enrollment request and payment proof submitted.' })
  }
)
