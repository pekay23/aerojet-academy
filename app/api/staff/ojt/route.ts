import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiCreated, apiPaginated, withErrorHandler, RouteContext } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'

// Minimum Part 145 experience thresholds
const MIN_EXPERIENCE = {
  B1_B2: 12, // months for B1/B2
  CAT_A: 6,  // months for Cat A
}

// GET — list OJT logbooks with progress
export const GET = withErrorHandler(async (req: NextRequest, _ctx: any) => {
  await requireStaff()
  const url = new URL(req.url)
  const status = url.searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (status) where.status = status

  const logbooks = await prismaUnfiltered.oJTLogbook.findMany({
    where,
    include: {
      studentProfile: {
        select: {
          studentId: true,
          user: { select: { profile: { select: { firstName: true, lastName: true } } } },
        },
      },
      mentorAssignments: {
        where: { isPrimary: true },
        take: 1,
      },
      _count: { select: { entries: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return apiSuccess(logbooks)
})

// POST — create an OJT logbook for a student
const createSchema = z.object({
  studentProfileId: z.string(),
  licenceCategory: z.string(),
  facilityName: z.string(),
  facilityApprovalNo: z.string().optional(),
  startDate: z.string(),
  targetEndDate: z.string().optional(),
  mentorId: z.string().optional(),
})

export const POST = withErrorHandler(async (req: NextRequest, _ctx?: RouteContext) => {
  await requireStaff()
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input')

  // Ensure student doesn't already have a logbook
  const existing = await prismaUnfiltered.oJTLogbook.findUnique({
    where: { studentProfileId: parsed.data.studentProfileId },
  })
  if (existing) return apiError('Student already has an OJT logbook', 409)

  const logbook = await prismaUnfiltered.$transaction(async (tx) => {
    const lb = await tx.oJTLogbook.create({
      data: {
        studentProfileId: parsed.data.studentProfileId,
        licenceCategory: parsed.data.licenceCategory,
        facilityName: parsed.data.facilityName,
        facilityApprovalNo: parsed.data.facilityApprovalNo || null,
        startDate: new Date(parsed.data.startDate),
        targetEndDate: parsed.data.targetEndDate ? new Date(parsed.data.targetEndDate) : null,
      },
    })

    // Assign primary mentor if provided
    if (parsed.data.mentorId) {
      await tx.oJTMentorAssignment.create({
        data: {
          logbookId: lb.id,
          mentorId: parsed.data.mentorId,
          assignedDate: new Date(),
          isPrimary: true,
        },
      })
    }

    return lb
  })

  return apiCreated(logbook)
})
