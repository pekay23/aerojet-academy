import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { getRequestContext } from '@/lib/server/request-context'
import { z } from 'zod'

const violationSchema = z.object({
  bankId: z.string().min(1),
  type: z.enum([
    'FULLSCREEN_EXIT',
    'TAB_SWITCH',
    'KEYBOARD_SHORTCUT',
    'NETWORK_DISCONNECT',
    'EXAM_INTERFACE_UNLOAD',
    'CLIPBOARD_BLOCKED',
    'DEVTOOLS_DETECTED',
  ]),
  detail: z.string().optional(),
  deviceInfo: z.any().optional(),
  severity: z.enum(['WARNING', 'NOTICE', 'CRITICAL']).optional(),
})

/**
 * POST /api/staff/exams/internal/preview/violations
 *
 * Logs a violation event during staff preview. Since preview creates no real
 * exam session, violations are recorded as audit-log entries so an admin can
 * review the lockdown behaviour the preview exhibits.
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const staff = await requireStaff()
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }

  const body = await req.json()
  const parsed = violationSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid request body', 400)
  }
  const { bankId, type, detail, deviceInfo, severity } = parsed.data

  const ctx = await getRequestContext()

  let computedSeverity = severity
  if (!computedSeverity) {
    computedSeverity = 'WARNING'
  }

  await createAuditLog({
    userId: staff.id,
    action: AuditAction.EXAM_VIOLATION_LOGGED,
    entity: 'InternalExamBank',
    entityId: bankId,
    description: `[Preview] ${type} violation during staff preview of bank ${bankId}`,
    changes: {
      type,
      severity: computedSeverity,
      detail,
      deviceInfo,
      source: 'preview',
    },
    ipAddress: ctx.ipAddress ?? undefined,
    userAgent: ctx.userAgent ?? undefined,
  })

  return apiSuccess({ severity: computedSeverity })
})
