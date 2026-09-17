import { NextRequest } from 'next/server'
import { apiSuccess, apiNotFound, apiError, withErrorHandler, RouteContext } from '@/lib/api/response'
import { getCertificateByNumber } from '@/lib/certificates/generator'
import { verifyDocument } from '@/lib/document-verification'

/**
 * GET /api/certificates/verify/[certificateId]
 * Public verification endpoint — no auth required.
 * Checks both the Certificate table and DocumentVerification revocation/expiry.
 */
export const GET = withErrorHandler(async (
  _req: NextRequest, ctx?: RouteContext) => {
  const { certificateId } = (await ctx!.params) as { certificateId: string }

  if (!certificateId) return apiError('certificateId is required', 400)

  const certificate = await getCertificateByNumber(certificateId)

  if (!certificate) return apiNotFound('Certificate not found')

  if (!certificate.verified) {
    return apiError('This certificate has not been verified', 404)
  }

  // Check DocumentVerification for revocation/expiry.
  // QR codes in PDFs point to /verify/{certificateId}, so we look up by
  // certificateNo (which stores the certificateId) as well as by code.
  const verification = await verifyDocument(undefined, certificateId)
  if (!verification) {
    return apiError('This certificate has been revoked or expired', 410)
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
    verificationCode: verification.code,
    revokedAt: verification.revokedAt?.toISOString() ?? null,
    expiresAt: verification.expiresAt?.toISOString() ?? null,
  })
})
