import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler , RouteContext } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getSignedUrl } from '@/lib/storage/supabase-storage'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { getRequestContext } from '@/lib/server/request-context'

export const GET = withErrorHandler(async (
  req: NextRequest, ctx?: RouteContext) => {
  const session = await getAuthSession()
  if (!session?.user?.id) return apiError('Unauthorized', 401)

  const { id } = (await ctx!.params) as { id: string }

  const certificate = await prismaUnfiltered.certificate.findUnique({
    where: { id },
    select: {
      id: true,
      certificateId: true,
      sessionId: true,
      studentId: true,
      pdfUrl: true,
      issuedAt: true,
      moduleCode: true,
      score: true,
      percentage: true,
      verified: true,
    },
  })

  if (!certificate) return apiNotFound('Certificate not found')

  const isStudent = session.user.role === 'STUDENT'
  const isStaff = ['ADMIN', 'SUPER_ADMIN', 'STAFF', 'EXAMINER'].includes(session.user.role)

  if (isStudent && certificate.studentId !== session.user.id) {
    return apiError('You do not have access to this certificate', 403)
  }

  if (!isStudent && !isStaff) {
    return apiError('Unauthorized', 401)
  }

  if (!certificate.pdfUrl) {
    return apiError('Certificate PDF has not been generated yet', 404)
  }

  const ctx2 = await getRequestContext().catch(() => ({ ipAddress: undefined, userAgent: undefined }))
  await createAuditLog({
    userId: session.user.id,
    action: AuditAction.SYSTEM_UPDATE,
    entity: 'Certificate',
    entityId: certificate.id,
    description: `Certificate PDF downloaded: ${certificate.certificateId}`,
    ipAddress: ctx2.ipAddress ?? undefined,
    userAgent: ctx2.userAgent ?? undefined,
  })

  // Return JSON with signed download URL for the client to fetch/stream
  const signedUrl = await getSignedUrl(certificate.pdfUrl, 60 * 60 * 24)
  if (!signedUrl) {
    return apiError('Unable to generate download URL', 500)
  }

  const filename = `Certificate_${certificate.certificateId}.pdf`

  return apiSuccess({
    certificateId: certificate.certificateId,
    issuedAt: certificate.issuedAt.toISOString(),
    moduleCode: certificate.moduleCode,
    score: certificate.score,
    percentage: certificate.percentage,
    verified: certificate.verified,
    downloadUrl: signedUrl,
    filename,
  })
})

export const DELETE = withErrorHandler(async (
  _req: NextRequest, ctx?: RouteContext) => {
  const session = await getAuthSession()
  if (!session?.user?.id) return apiError('Unauthorized', 401)

  const isStaff = ['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)
  if (!isStaff) return apiError('Only staff can revoke certificates', 403)

  const { id } = (await ctx!.params) as { id: string }

  const certificate = await prismaUnfiltered.certificate.findUnique({
    where: { id },
    select: { id: true, certificateId: true, studentId: true },
  })

  if (!certificate) return apiNotFound('Certificate not found')

  await prismaUnfiltered.certificate.delete({ where: { id } })

  return apiSuccess({ deleted: true, certificateId: certificate.certificateId })
})
