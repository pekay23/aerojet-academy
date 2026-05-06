import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
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
    const { yearNumber, yearFeeAmount, seatConfirmationFee, firstPaymentAmount, semesters } = body

    if (!yearNumber || !semesters || !Array.isArray(semesters)) {
      return apiError('Year number and semesters array are required')
    }

    const programme = await prismaUnfiltered.fullTimeProgramme.findUnique({ where: { id: programmeId } })
    if (!programme) return apiError('Programme not found', 404)

    const existing = await prismaUnfiltered.programmeYear.findUnique({
      where: { programmeId_yearNumber: { programmeId, yearNumber: parseInt(yearNumber) } },
    })
    if (existing) return apiError(`Year ${yearNumber} already exists for this programme`)

    const year = await prismaUnfiltered.programmeYear.create({
      data: {
        programmeId,
        yearNumber: parseInt(yearNumber),
        yearFeeAmount: yearFeeAmount ? parseFloat(yearFeeAmount) : null,
        seatConfirmationFee: seatConfirmationFee ? parseFloat(seatConfirmationFee) : 1500,
        firstPaymentAmount: firstPaymentAmount ? parseFloat(firstPaymentAmount) : 3500,
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
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const staff = await requireStaff()
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
          yearFeeAmount: yearFeeAmount ? parseFloat(yearFeeAmount) : null,
        }),
        ...(seatConfirmationFee !== undefined && {
          seatConfirmationFee: parseFloat(seatConfirmationFee),
        }),
        ...(firstPaymentAmount !== undefined && {
          firstPaymentAmount: parseFloat(firstPaymentAmount),
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
      details: body,
    })

    return apiSuccess(updated)
  }
)
