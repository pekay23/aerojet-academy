import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'
import { BondingStatus } from '@prisma/client'
import { z } from 'zod'

const VALID_TRANSITIONS: Record<BondingStatus, BondingStatus[]> = {
  ISSUED: [BondingStatus.SIGNED],
  SIGNED: [BondingStatus.IN_PROGRESS],
  IN_PROGRESS: [BondingStatus.FULFILLED, BondingStatus.BREACHED],
  FULFILLED: [],
  BREACHED: [],
}

const updateSchema = z.object({
  status: z.nativeEnum(BondingStatus).optional(),
  facilityName: z.string().optional(),
  notes: z.string().optional(),
  signedAt: z.string().datetime().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
})

export const GET = withErrorHandler(async (_req: NextRequest, ctx: any) => {
  await requireStaff()
  const { id } = ctx.params

  const contract = await prismaUnfiltered.bondingContract.findUnique({
    where: { id },
    include: {
      application: {
        select: {
          programmeChoice: true,
          fundingType: true,
          stage: true,
          user: {
            select: {
              id: true,
              email: true,
              profile: { select: { firstName: true, lastName: true, phone: true } },
            },
          },
        },
      },
      studentProfile: {
        select: { studentId: true, enrollmentStatus: true, enrollmentDate: true },
      },
    },
  })

  if (!contract) return apiError('Bonding contract not found', 404)
  return apiSuccess(contract)
})

export const PUT = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const staff = await requireStaff()
  const { id } = ctx.params

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message)

  const contract = await prismaUnfiltered.bondingContract.findUnique({ where: { id } })
  if (!contract) return apiError('Bonding contract not found', 404)

  const { status, facilityName, notes, signedAt, startDate, endDate } = parsed.data

  // Validate status transition
  if (status && status !== contract.status) {
    const allowed = VALID_TRANSITIONS[contract.status]
    if (!allowed.includes(status)) {
      return apiError(
        `Cannot transition from ${contract.status} to ${status}. Allowed: ${allowed.join(', ') || 'none (terminal state)'}`
      )
    }
  }

  const updated = await prismaUnfiltered.bondingContract.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(facilityName !== undefined ? { facilityName } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(signedAt !== undefined ? { signedAt: signedAt ? new Date(signedAt) : null } : {}),
      ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
      ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
      updatedBy: staff.id,
    },
    include: {
      application: {
        select: {
          programmeChoice: true,
          fundingType: true,
          user: {
            select: {
              id: true,
              email: true,
              profile: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
      studentProfile: { select: { studentId: true } },
    },
  })

  if (status && status !== contract.status) {
    await createAuditLog({
      userId: staff.id,
      action: 'UPDATE',
      entity: 'BondingContract',
      entityId: id,
      description: `Bonding contract status changed from ${contract.status} to ${status}`,
      changes: { from: contract.status, to: status, notes },
    })
  }

  return apiSuccess(updated)
})
