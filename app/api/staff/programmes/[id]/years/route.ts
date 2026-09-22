import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiCreated, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

// POST /api/staff/programmes/[id]/years — Add a programme year
export const POST = withErrorHandler(
  async (req: NextRequest, context?: { params: Promise<Record<string, string>> }) => {
    const staff = await requireStaff()
    if (!context) return apiError('Context required')
    const params = await context.params
    const programmeId = params.id
    if (!programmeId) return apiError('Programme ID required')

    const body = await req.json()
    const { yearNumber, yearFeeAmount, seatConfirmationFee, firstPaymentAmount, semesters } = body

    if (!yearNumber || !semesters || !Array.isArray(semesters)) {
      return apiError('Year number and semesters array are required')
    }

    const programme = await prismaUnfiltered.fullTimeProgramme.findUnique({ where: { id: programmeId } })
    if (!programme) return apiError('Programme not found', 404)

    const parsedYearNumber = Number.parseInt(yearNumber, 10)
    if (Number.isNaN(parsedYearNumber) || parsedYearNumber < 1) {
      return apiError('Invalid year number')
    }

    const existing = await prismaUnfiltered.programmeYear.findUnique({
      where: { programmeId_yearNumber: { programmeId, yearNumber: parsedYearNumber } },
    })
    if (existing) return apiError(`Year ${yearNumber} already exists for this programme`)

    const parsedYearFee = yearFeeAmount ? Number.parseFloat(yearFeeAmount) : null
    const parsedSeatFee = seatConfirmationFee
      ? Number.parseFloat(seatConfirmationFee)
      : 1500
    const parsedFirstPayment = firstPaymentAmount
      ? Number.parseFloat(firstPaymentAmount)
      : 3500

    const year = await prismaUnfiltered.programmeYear.create({
      data: {
        programmeId,
        yearNumber: parsedYearNumber,
        yearFeeAmount: parsedYearFee,
        seatConfirmationFee: parsedSeatFee,
        firstPaymentAmount: parsedFirstPayment,
        semesters: semesters,
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
  async (req: NextRequest, _context?: { params: Promise<Record<string, string>> }) => {
    const staff = await requireStaff()
    const params = await _context?.params ?? { id: '' }
    void params

    const body = await req.json()
    const { yearId, yearFeeAmount, seatConfirmationFee, firstPaymentAmount, semesters, isActive } =
      body

    if (!yearId) return apiError('Year ID required')

    const year = await prismaUnfiltered.programmeYear.findUnique({ where: { id: yearId } })
    if (!year) return apiError('Programme year not found', 404)

    const updated = await prismaUnfiltered.programmeYear.update({
      where: { id: yearId },
      data: {
        ...(yearFeeAmount !== undefined && {
          yearFeeAmount: yearFeeAmount ? Number.parseFloat(yearFeeAmount) : null,
        }),
        ...(seatConfirmationFee !== undefined && {
          seatConfirmationFee: Number.isNaN(Number.parseFloat(seatConfirmationFee))
          ? year.seatConfirmationFee
          : Number.parseFloat(seatConfirmationFee),
        }),
        ...(firstPaymentAmount !== undefined && {
          firstPaymentAmount: Number.isNaN(Number.parseFloat(firstPaymentAmount))
          ? year.firstPaymentAmount
          : Number.parseFloat(firstPaymentAmount),
        }),
        ...(semesters !== undefined && {
          semesters: semesters,
        }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    await createAuditLog({
      action: AuditAction.UPDATE,
      entity: 'ProgrammeYear',
      entityId: yearId,
      userId: staff.id,
      description: `Updated programme year ${yearId}`,
      changes: { before: body, after: { yearFeeAmount, seatConfirmationFee, firstPaymentAmount, semesters, isActive } },
    })

    return apiSuccess(updated)
  }
)
