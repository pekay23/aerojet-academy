import { NextRequest } from 'next/server'
import { apiSuccess, apiNotFound, apiError, withErrorHandler } from '@/lib/api/response'
import { getCertificateByNumber } from '@/lib/certificates/generator'

/**
 * GET /api/certificates/verify/[certificateId]
 * Public verification endpoint — no auth required.
 * Returns certificate details for verification purposes.
 */
export const GET = withErrorHandler(async (
  _req: NextRequest,
  ctx: { params: Promise<{ certificateId: string }> }
) => {
  const { certificateId } = await ctx.params

  if (!certificateId) return apiError('certificateId is required', 400)

  const certificate = await getCertificateByNumber(certificateId)

  if (!certificate) return apiNotFound('Certificate not found')

  if (!certificate.verified) {
    return apiError('This certificate has not been verified', 404)
  }

  const studentName = certificate.student?.profile
    ? `${certificate.student.profile.firstName} ${certificate.student.profile.lastName}`
    : certificate.student?.email || 'Student'

  return apiSuccess({
    certificateId: certificate.certificateId,
    studentName,
    studentId: certificate.student?.studentProfile?.studentId || null,
    moduleCode: certificate.moduleCode,
    score: certificate.score,
    percentage: certificate.percentage,
    issuedAt: certificate.issuedAt.toISOString(),
    template: certificate.template,
    verified: certificate.verified,
  })
})
