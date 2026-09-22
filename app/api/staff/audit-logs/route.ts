import { NextRequest } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/auth/permissions'
import { apiPaginated, withErrorHandler } from '@/lib/api/response'
import { parsePagination } from '@/lib/api/response'
import { queryAuditLogs } from '@/lib/audit/logger'
import { AuditAction } from '@/lib/audit/logger'
import { maskIp } from '@/lib/utils/string'

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requirePermission(PERMISSIONS.VIEW_AUDIT_LOGS)
  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)

  const action = searchParams.get('action') as AuditAction | undefined
  const entity = searchParams.get('entityType') || undefined
  const userId = searchParams.get('userId') || undefined
  const startDate = searchParams.get('startDate')
    ? new Date(searchParams.get('startDate')!)
    : undefined
  const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined

  const { logs, total } = await queryAuditLogs({
    action,
    entity,
    userId,
    startDate,
    endDate,
    limit,
    offset: skip,
  })
  return apiPaginated(
    logs.map((l) => ({ ...l, ipAddress: maskIp(l.ipAddress) })),
    total,
    page,
    limit
  )
})
