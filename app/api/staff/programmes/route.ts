import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiCreated, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

// GET /api/staff/programmes
export const GET = withErrorHandler(async () => {
  await requireStaff()

  const programmes = await prismaUnfiltered.fullTimeProgramme.findMany({
    include: {
      programmeYears: { orderBy: { yearNumber: 'asc' } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { code: 'asc' },
    take: 200,
  })

  return apiSuccess(programmes)
})

// POST /api/staff/programmes
export const POST = withErrorHandler(async (req: NextRequest) => {
  const staff = await requireStaff()
  const body = await req.json()
  const { code, name, durationYears, totalFee, currency, description } = body

  if (!code || !name || !durationYears || !totalFee) {
    return apiError('Code, name, duration, and total fee are required')
  }

  const existing = await prismaUnfiltered.fullTimeProgramme.findUnique({ where: { code } })
  if (existing) return apiError(`Programme with code "${code}" already exists`)

  const programme = await prismaUnfiltered.fullTimeProgramme.create({
    data: {
      code,
      name,
      durationYears: parseInt(durationYears),
      totalFee: parseFloat(totalFee),
      currency: currency || 'EUR',
      description: description || null,
    },
  })

  await createAuditLog({
    action: AuditAction.CREATE,
    entity: 'FullTimeProgramme',
    entityId: programme.id,
    userId: staff.id,
    details: { code, name },
  })

  return apiCreated(programme)
})
