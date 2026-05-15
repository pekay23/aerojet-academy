import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiCreated, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'

// GET — list upgrade requests
export const GET = withErrorHandler(async (req: NextRequest, _ctx: any) => {
  await requireStaff()
  const url = new URL(req.url)
  const status = url.searchParams.get('status')

  const where: any = {}
  if (status) where.status = status

  const requests = await prismaUnfiltered.programmeUpgradeRequest.findMany({
    where,
    include: {
      studentProfile: {
        select: {
          studentId: true,
          user: { select: { profile: { select: { firstName: true, lastName: true } } } },
        },
      },
      application: { select: { programmeChoice: true, completionDeadline: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return apiSuccess(requests)
})

// POST — initiate upgrade request (typically 2yr → 4yr)
const createSchema = z.object({
  applicationId: z.string(),
  studentProfileId: z.string(),
  fromProgramme: z.string(),
  toProgramme: z.string(),
  reason: z.string().optional(),
  paymentDifference: z.number().optional(),
})

export const POST = withErrorHandler(async (req: NextRequest, _ctx: any) => {
  const staff = await requireStaff()
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input')

  const request = await prismaUnfiltered.programmeUpgradeRequest.create({
    data: {
      applicationId: parsed.data.applicationId,
      studentProfileId: parsed.data.studentProfileId,
      fromProgramme: parsed.data.fromProgramme as any,
      toProgramme: parsed.data.toProgramme as any,
      initiatedBy: staff.id,
      reason: parsed.data.reason || null,
      paymentDifference: parsed.data.paymentDifference || null,
    },
  })

  return apiCreated(request)
})
