import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler , RouteContext } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'

const _qualSchema = z.object({
  qualificationType: z.string().min(1),
  issuedBy: z.string().min(1),
  issueDate: z.string(),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
})

const _recencySchema = z.object({
  activityType: z.enum(['CLASSROOM_INSTRUCTION', 'PRACTICAL_SUPERVISION', 'UPDATE_TRAINING', 'EXAM_INVIGILATION', 'INDUSTRY_EXPERIENCE', 'OTHER']),
  description: z.string().min(1),
  hours: z.number().min(0.5),
  date: z.string(),
})

// GET — single instructor detail
export const GET = withErrorHandler(async (_req: NextRequest, ctx?: RouteContext) => {
  await requireStaff()
  const { id } = (await ctx!.params) as { id: string }

  const instructor = await prismaUnfiltered.instructorProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          status: true,
          profile: { select: { firstName: true, lastName: true, phone: true } },
        },
      },
      instructorQualifications: { orderBy: { issueDate: 'desc' } },
      instructorRecency: { orderBy: { date: 'desc' } },
      classesInstructed: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, courseId: true },
      },
    },
  })

  if (!instructor) return apiError('Instructor not found', 404)
  return apiSuccess(instructor)
})

// PUT — update instructor profile
export const PUT = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  await requireStaff()
  const { id } = (await ctx!.params) as { id: string }
  const body = await req.json()

  const updated = await prismaUnfiltered.instructorProfile.update({
    where: { id },
    data: {
      department: body.department,
      specialization: body.specialization,
      modulesQualified: body.modulesQualified || [],
    },
  })

  return apiSuccess(updated)
})
