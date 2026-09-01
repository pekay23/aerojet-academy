import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { withErrorHandler, apiError, apiSuccess } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { buildSebConfig, generateSebConfig, BankSebConfig } from '@/lib/internal-exam/seb-config'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

// GET /api/student/exams/internal/banks/[bankId]/seb-config — return .seb config for a bank
export const GET = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ bankId: string }> }) => {
  const session = await getAuthSession()
  if (!session?.user?.id) return apiError('Unauthorized', 401)

  const { bankId } = await ctx.params

  const bank = await prismaUnfiltered.internalExamBank.findUnique({
    where: { id: bankId },
    select: { id: true, name: true, sebConfig: true, courseId: true },
  })

  if (!bank) {
    return apiError('Exam bank not found', 404)
  }

  const enrollment = await prismaUnfiltered.enrollment.findFirst({
    where: {
      userId: session.user.id,
      courseId: bank.courseId,
      status: { in: ['ENROLLED', 'ACTIVE', 'APPROVED'] },
    },
  })

  if (!enrollment) {
    return apiError('You must be enrolled in the course to download this config', 403)
  }

  const schedule = await prismaUnfiltered.internalExamClassSchedule.findFirst({
    where: { bankId, sebRequired: true },
    select: { sebRequired: true },
  })

  if (!schedule) {
    return apiError('SEB is not required for this exam bank', 403)
  }

  const bankConfig = (bank.sebConfig as BankSebConfig | null) ?? null
  const startUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/student/exams/internal/take/${bankId}`

  const sebConfig = buildSebConfig({
    bekPair: { publicKey: '', privateKey: '', configKey: '' },
    startUrl,
    examDurationSecs: 0,
    bankConfig,
  })

  sebConfig.browserExamKey = ''
  sebConfig.config_key = ''

  const sebZip = generateSebConfig(sebConfig)

  await createAuditLog({
    action: AuditAction.EXAM_SESSION_STARTED,
    userId: session.user.id,
    entity: 'InternalExamBank',
    entityId: bankId,
    description: `SEB config downloaded for bank ${bankId}`,
    details: { bankId, bankName: bank.name },
  })

  const headers = new Headers()
  headers.set('Content-Type', 'application/octet-stream')
  headers.set('Content-Disposition', `attachment; filename="exam-${bankId}.seb"`)

  return new NextResponse(Buffer.from(sebZip), { headers, status: 200 })
})
