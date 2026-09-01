import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { buildSebConfig, generateSebConfig, type BankSebConfig } from '@/lib/internal-exam/seb-config'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'

/**
 * GET /api/staff/exams/internal/banks/[bankId]/seb-config/download
 *
 * Generates and returns a .seb config ZIP for staff preview, mirroring the
 * student SEB config download but without enrollment/schedule gating — staff
 * can inspect the SEB configuration for any bank.
 */
export const GET = withErrorHandler(async (req: NextRequest, ctx: { params: Promise<{ bankId: string }> }) => {
  const staff = await requireStaff()
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }
  const { bankId } = await ctx.params

  const bank = await prismaUnfiltered.internalExamBank.findUnique({
    where: { id: bankId },
    select: { id: true, name: true, sebConfig: true, mcqCount: true },
  })

  if (!bank) {
    return apiError('Bank not found', 404)
  }

  const bankSebConfig = (bank.sebConfig as BankSebConfig | null) ?? null
  const startUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/student/exams/internal/take/${bankId}`
  const examDurationSecs = bank.mcqCount * 75

  const sebConfig = buildSebConfig({
    bekPair: { publicKey: '', privateKey: '', configKey: '' },
    startUrl,
    examDurationSecs,
    bankConfig: bankSebConfig,
  })

  sebConfig.browserExamKey = ''
  sebConfig.config_key = ''

  const sebZip = generateSebConfig(sebConfig)

  await createAuditLog({
    userId: staff.id,
    action: AuditAction.SYSTEM_UPDATE,
    entity: 'InternalExamBank',
    entityId: bankId,
    description: `Staff downloaded SEB config for preview of bank "${bank.name}"`,
    changes: { bankId, bankName: bank.name, sebConfig: bankSebConfig },
  })

  const headers = new Headers()
  headers.set('Content-Type', 'application/octet-stream')
  headers.set('Content-Disposition', `attachment; filename="exam-${bankId}.seb"`)

  return new NextResponse(Buffer.from(sebZip), { headers, status: 200 })
})
