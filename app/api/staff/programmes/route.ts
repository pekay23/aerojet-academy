import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiCreated, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

// GET /api/staff/programmes
export const GET = withErrorHandler(async () => {
  await requireStaff()

  const programmes = await prisma.fullTimeProgramme.findMany({
    include: {
      programmeYears: { orderBy: { yearNumber: 'asc' } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { code: 'asc' },
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

  const existing = await prisma.fullTimeProgramme.findUnique({ where: { code } })
  if (existing) return apiError(`Programme with code "${code}" already exists`)

  const programme = await prisma.fullTimeProgramme.create({
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
