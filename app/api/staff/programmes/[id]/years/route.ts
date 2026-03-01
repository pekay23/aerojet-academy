import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiCreated, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

// POST /api/staff/programmes/[id]/years — Add a programme year
export const POST = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const programmeId = context?.params?.id
    if (!programmeId) return apiError('Programme ID required')

    const body = await req.json()
    const { yearNumber, yearFeeAmount, seatConfirmationFee, firstPaymentAmount, semester1StartDate, semester2StartDate } = body

    if (!yearNumber || !semester1StartDate || !semester2StartDate) {
      return apiError('Year number and semester start dates are required')
    }

    const programme = await prisma.fullTimeProgramme.findUnique({ where: { id: programmeId } })
    if (!programme) return apiError('Programme not found', 404)

    const existing = await prisma.programmeYear.findUnique({
      where: { programmeId_yearNumber: { programmeId, yearNumber: parseInt(yearNumber) } },
    })
    if (existing) return apiError(`Year ${yearNumber} already exists for this programme`)

    const year = await prisma.programmeYear.create({
      data: {
        programmeId,
        yearNumber: parseInt(yearNumber),
        yearFeeAmount: yearFeeAmount ? parseFloat(yearFeeAmount) : null,
        seatConfirmationFee: seatConfirmationFee ? parseFloat(seatConfirmationFee) : 1500,
        firstPaymentAmount: firstPaymentAmount ? parseFloat(firstPaymentAmount) : 3500,
        semester1StartDate: new Date(semester1StartDate),
        semester2StartDate: new Date(semester2StartDate),
      },
    })

    await createAuditLog({
      action: AuditAction.CREATE,
      entity: 'ProgrammeYear',
      entityId: year.id,
      userId: staff.id,
      details: { programmeId, yearNumber },
    })

    return apiCreated(year)
  }
)

// PATCH /api/staff/programmes/[id]/years — Update a programme year
export const PATCH = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
    const body = await req.json()
    const { yearId, yearFeeAmount, seatConfirmationFee, firstPaymentAmount, semester1StartDate, semester2StartDate, isActive } = body

    if (!yearId) return apiError('Year ID required')

    const year = await prisma.programmeYear.findUnique({ where: { id: yearId } })
    if (!year) return apiError('Programme year not found', 404)

    const updated = await prisma.programmeYear.update({
      where: { id: yearId },
      data: {
        ...(yearFeeAmount !== undefined && { yearFeeAmount: yearFeeAmount ? parseFloat(yearFeeAmount) : null }),
        ...(seatConfirmationFee !== undefined && { seatConfirmationFee: parseFloat(seatConfirmationFee) }),
        ...(firstPaymentAmount !== undefined && { firstPaymentAmount: parseFloat(firstPaymentAmount) }),
        ...(semester1StartDate !== undefined && { semester1StartDate: new Date(semester1StartDate) }),
        ...(semester2StartDate !== undefined && { semester2StartDate: new Date(semester2StartDate) }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'ProgrammeYear',
      entityId: yearId,
      userId: staff.id,
      details: body,
    })

    return apiSuccess(updated)
  }
)
