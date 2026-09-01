import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import {
  createCertificate,
  getCertificatesEnabled,
  getCertificateDownloadUrl,
} from '@/lib/certificates/generator'

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getAuthSession()
  if (!session?.user?.id) return apiError('Unauthorized', 401)

  const certificatesEnabled = await getCertificatesEnabled()
  if (!certificatesEnabled) {
    return apiError('Certificate generation is disabled', 403)
  }

  const STAFF_ROLES = ['ADMIN', 'SUPER_ADMIN', 'STAFF', 'EXAMINER']
  const isAuthorized = STAFF_ROLES.includes(session.user.role)
  if (!isAuthorized) {
    return apiError('Only staff can generate certificates', 403)
  }

  const body = await req.json().catch(() => ({}))
  const { sessionId } = body

  if (!sessionId) return apiError('sessionId is required', 400)

  const examSession = await prismaUnfiltered.internalExamSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      studentId: true,
      bankId: true,
      score: true,
      percentage: true,
      passed: true,
      isPublished: true,
      status: true,
      bank: {
        select: {
          name: true,
          moduleCode: true,
          courseId: true,
          course: { select: { code: true, name: true } },
          ruleSet: true,
        },
      },
    },
  })

  if (!examSession) return apiError('Exam session not found', 404)
  if (!examSession.isPublished) return apiError('Results must be published before generating a certificate', 409)
  if (examSession.status !== 'COMPLETED' && examSession.status !== 'TIMED_OUT') {
    return apiError('Exam session must be completed to generate a certificate', 409)
  }

  const result = await createCertificate({
    sessionId: examSession.id,
    studentId: examSession.studentId,
    courseId: examSession.bank.courseId,
    moduleCode: examSession.bank.moduleCode,
    score: examSession.score ?? 0,
    percentage: examSession.percentage ?? 0,
    passMarkPct: undefined,
    issuedBy: session.user.id,
  })

  return apiSuccess(result)
})

export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await getAuthSession()
  if (!session?.user?.id) return apiError('Unauthorized', 401)

  const STUDENT_ROLES = ['STUDENT']
  const isStudent = STUDENT_ROLES.includes(session.user.role)
  const isStaff = ['ADMIN', 'SUPER_ADMIN', 'STAFF', 'EXAMINER'].includes(session.user.role)

  if (!isStudent && !isStaff) {
    return apiError('Unauthorized', 401)
  }

  const url = new URL(req.url)
  const sessionIdFilter = url.searchParams.get('sessionId')

  const where: any = {}
  if (isStudent) {
    where.studentId = session.user.id
  }
  if (sessionIdFilter) {
    where.sessionId = sessionIdFilter
  }

  const certificates = await prismaUnfiltered.certificate.findMany({
    where,
    include: {
      student: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true } },
          studentProfile: { select: { studentId: true } },
        },
      },
    },
    orderBy: { issuedAt: 'desc' },
  })

  const result = await Promise.all(
    certificates.map(async (cert) => {
      const downloadUrl = cert.pdfUrl
        ? await getCertificateDownloadUrl(cert.pdfUrl)
        : null
      return {
        id: cert.id,
        certificateId: cert.certificateId,
        sessionId: cert.sessionId,
        studentId: cert.studentId,
        studentName: cert.student?.profile
          ? `${cert.student.profile.firstName} ${cert.student.profile.lastName}`
          : cert.student?.email || '',
        moduleCode: cert.moduleCode,
        score: cert.score,
        percentage: cert.percentage,
        issuedAt: cert.issuedAt.toISOString(),
        issuedBy: cert.issuedBy,
        verified: cert.verified,
        downloadUrl,
      }
    })
  )

  return apiSuccess(result)
})
