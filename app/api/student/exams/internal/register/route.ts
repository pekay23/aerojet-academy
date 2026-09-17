import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { internalExamRegistrationSchema } from '@/lib/validation/schemas'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { getRequestContext } from '@/lib/server/request-context'

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getAuthSession()
  if (!session?.user?.id) return apiError('Unauthorized', 401)
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }

  const body = await req.json()
  const parsed = internalExamRegistrationSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; '), 400)
  }

  const data = parsed.data

  const examSession = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id: data.sessionId },
    select: { id: true, studentId: true },
  })

  if (!examSession) return apiError('Session not found', 404)

  const validCode = await prismaUnfiltered.internalExamAccessCode.findFirst({
    where: {
      sessionId: data.sessionId,
      candidateId: session.user.id,
      used: true,
    },
  })

  if (!validCode) {
    return apiError('No valid access code found for this session', 403)
  }

  // Verify candidate has a registration record (created during access-code validation)
  const existing = await prismaUnfiltered.internalExamRegistration.findFirst({
    where: { sessionId: data.sessionId, userId: session.user.id },
  })

  if (!existing) {
    return apiError('No registration found. Please validate your access code first.', 403)
  }

  if (existing.status === 'COMPLETED') {
    return apiError('Registration already completed for this session', 409)
  }

  // Update the registration with full candidate details
  const registration = await prismaUnfiltered.internalExamRegistration.update({
    where: { id: existing.id },
    data: {
      fullName: data.fullName,
      dateOfBirth: new Date(data.dateOfBirth),
      nationality: data.nationality,
      email: data.email,
      phone: data.phone,
      licenceCategory: data.licenceCategory,
      modules: data.modules,
      examDate: data.examDate ? new Date(data.examDate) : undefined,
      examLocation: data.examLocation,
      candidatePhoto: data.candidatePhoto || undefined,
      idDocumentType: data.idDocumentType,
      idDocumentNumber: data.idDocumentNumber,
      consentTruthfulness: data.consentTruthfulness,
      consentMonitoring: data.consentMonitoring,
      consentIdentity: data.consentIdentity,
      consentProcessing: data.consentProcessing,
      status: 'COMPLETED',
    },
  })

  const ctx = await getRequestContext()
  await createAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'InternalExamRegistration',
    entityId: registration.id,
    description: `Candidate completed pre-exam registration for session ${data.sessionId}`,
    changes: { sessionId: data.sessionId, fullName: data.fullName, status: 'COMPLETED' },
    ipAddress: ctx.ipAddress ?? undefined,
    userAgent: ctx.userAgent ?? undefined,
  })

  return apiSuccess({ success: true, registrationId: registration.id })
})
