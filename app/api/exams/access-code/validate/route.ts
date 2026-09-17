import { NextRequest } from 'next/server'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { z } from 'zod'

const validateSchema = z.object({
  code: z.string().min(4).max(32),
})

/**
 * POST /api/exams/access-code/validate
 *
 * Validates an exam access code for a candidate.
 * Binds the candidate to the session by creating an InternalExamRegistration record.
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

  // Require authentication to bind the candidate
  const authSession = await getAuthSession()
  if (!authSession?.user?.id) {
    return apiError('Authentication required', 401)
  }

  // If candidate-bound, verify identity matches
  if (accessCode.candidateId && accessCode.candidateId !== authSession.user.id) {
    return apiError('This access code is not assigned to you', 403)
  }

  // Bind candidate to session by creating a registration record
  const existingRegistration = await prismaUnfiltered.internalExamRegistration.findFirst({
    where: { sessionId: accessCode.sessionId, userId: authSession.user.id },
  })

  let registrationId: string | null = existingRegistration?.id ?? null

  if (!existingRegistration) {
    const registration = await prismaUnfiltered.internalExamRegistration.create({
      data: {
        sessionId: accessCode.sessionId,
        userId: authSession.user.id,
        status: 'PENDING',
      },
    })
    registrationId = registration.id

    await createAuditLog({
      userId: authSession.user.id,
      action: AuditAction.CREATE,
      entity: 'InternalExamRegistration',
      entityId: registration.id,
      description: `Candidate bound to exam session ${accessCode.sessionId} via access code`,
      changes: { sessionId: accessCode.sessionId, code: normalizedCode },
    })
  }

  return apiSuccess({
    valid: true,
    code: normalizedCode,
    sessionId: accessCode.sessionId,
    examName: accessCode.session.bank.name,
    candidateName: accessCode.session.student
      ? `${accessCode.session.student.firstName} ${accessCode.session.student.lastName}`
      : null,
    registrationId,
  })
})
