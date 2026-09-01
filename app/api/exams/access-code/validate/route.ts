import { NextRequest } from 'next/server'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'

const validateSchema = z.object({
  code: z.string().min(4).max(32),
})

/**
 * POST /api/exams/access-code/validate
 *
 * Validates an exam access code for external candidates.
 * Returns the session ID if valid, or an error if invalid/expired/used.
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json()
  const parsed = validateSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid request body', 400)
  }

  const normalizedCode = parsed.data.code.toUpperCase()

  // Find the access code
  const accessCode = await prismaUnfiltered.internalExamAccessCode.findUnique({
    where: { code: normalizedCode },
    include: {
      session: {
        include: {
          bank: { select: { id: true, name: true, mcqCount: true } },
          student: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  })

  if (!accessCode) {
    return apiError('Invalid access code', 404)
  }

  if (accessCode.used) {
    return apiError('This access code has already been used', 403)
  }

  if (accessCode.expiresAt < new Date()) {
    return apiError('This access code has expired', 403)
  }

  // If candidate-bound, verify identity (simplified - in production, match against form data)
  if (accessCode.candidateId) {
    // For now, just return the session; identity verification happens in the pre-exam form
  }

  return apiSuccess({
    valid: true,
    code: normalizedCode,
    sessionId: accessCode.sessionId,
    examName: accessCode.session.bank.name,
    candidateName: accessCode.session.student
      ? `${accessCode.session.student.firstName} ${accessCode.session.student.lastName}`
      : null,
  })
})
