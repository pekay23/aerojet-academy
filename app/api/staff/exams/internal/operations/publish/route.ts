import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'
import { createNotification } from '@/lib/email/service'
import { getCertificatesEnabled, createCertificate } from '@/lib/certificates/generator'
import { getBankRules } from '@/lib/internal-exam/engine'

const publishSchema = z.object({
  sessionIds: z.array(z.string()).min(1).max(500),
})

/**
 * POST /api/staff/exams/internal/operations/publish
 * Publishes results for one or more completed exam sessions. Once
 * published, students can see their scores in their exam records.
 * Idempotent — sessions already published are skipped silently.
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const staff = await requireStaff()

  const body = await req.json()
  const parsed = publishSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input — provide an array of session IDs')

  const { sessionIds } = parsed.data

  // Only publish sessions that are COMPLETED or TIMED_OUT and not already
  // published. Snapshot the ids that will flip so we can audit-log them.
  const candidates = await prismaUnfiltered.internalExamSession.findMany({
    where: {
      id: { in: sessionIds },
      status: { in: ['COMPLETED', 'TIMED_OUT'] },
      isPublished: false,
    },
    select: {
      id: true,
      studentId: true,
      bankId: true,
      percentage: true,
      passed: true,
      bank: { select: { certificateEnabled: true } },
    },
  })

  if (candidates.length === 0) {
    return apiSuccess({ published: 0 })
  }

  const result = await prismaUnfiltered.internalExamSession.updateMany({
    where: { id: { in: candidates.map((c) => c.id) } },
    data: { isPublished: true },
  })

  await createAuditLog({
    userId: staff.id,
    action: 'UPDATE',
    entity: 'InternalExamSession',
    entityId: candidates.length === 1 ? candidates[0].id : `batch:${result.count}`,
    description: `Published ${result.count} internal exam result${result.count === 1 ? '' : 's'}`,
    changes: {
      sessionIds: candidates.map((c) => c.id),
      before: { isPublished: false },
      after: { isPublished: true },
    },
  })

  // Notify students that their results are published
  const notifPromises = candidates.map((c) =>
    createNotification(prismaUnfiltered, c.studentId, {
      type: 'SUCCESS',
      title: 'Exam Results Published',
      message: `Your internal exam result has been published. You can now view your score.`,
      link: '/student/exams/internal',
    }).catch((err) => console.error('[NOTIFICATION ERROR]', err))
  )
  await Promise.allSettled(notifPromises)

  // Auto-generate certificates for students who passed (feature-gated).
  // Requires both the global toggle AND the per-bank certificateEnabled flag.
  const certificatesEnabled = await getCertificatesEnabled()
  let certificatesGenerated = 0
  if (certificatesEnabled) {
    const passingSessions = candidates.filter((c) => c.passed && c.bank.certificateEnabled)
    const certPromises: Promise<unknown>[] = []

    for (const c of passingSessions) {
      const rules = await getBankRules(c.bankId)
      const certPromise = createCertificate({
        sessionId: c.id,
        studentId: c.studentId,
        score: 0,
        percentage: c.percentage ?? 0,
        passMarkPct: rules.passMarkPct,
        issuedBy: staff.id,
      }).catch((err) => {
        console.error(`[certificates] Failed to generate certificate for session ${c.id}:`, err)
        return null
      })
      certPromises.push(certPromise)
    }

    const certResults = await Promise.allSettled(certPromises)
    certificatesGenerated = certResults.filter(
      (r) => r.status === 'fulfilled' && r.value != null
    ).length
  }

  return apiSuccess({ published: result.count, certificatesGenerated })
})
