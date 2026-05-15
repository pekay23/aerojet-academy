import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiCreated, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'

const evaluationSchema = z.object({
  communicationScore: z.number().int().min(1).max(10),
  technicalScore: z.number().int().min(1).max(10),
  motivationScore: z.number().int().min(1).max(10),
  problemSolvingScore: z.number().int().min(1).max(10),
  teamworkScore: z.number().int().min(1).max(10),
  professionalismScore: z.number().int().min(1).max(10),
  overallImpression: z.number().int().min(1).max(10),
  personalScore: z.number().int().min(0).max(100),
  recommendation: z.enum(['STRONG_YES', 'YES', 'MAYBE', 'NO', 'STRONG_NO']),
  communicationNotes: z.string().optional(),
  technicalNotes: z.string().optional(),
  motivationNotes: z.string().optional(),
  problemSolvingNotes: z.string().optional(),
  teamworkNotes: z.string().optional(),
  professionalismNotes: z.string().optional(),
  generalRemarks: z.string().optional(),
})

// GET — list all evaluations for an application
export const GET = withErrorHandler(async (_req: NextRequest, ctx: any) => {
  await requireStaff()
  const { applicationId } = ctx.params

  const evaluations = await prismaUnfiltered.interviewEvaluation.findMany({
    where: { applicationId },
    include: {
      evaluator: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Calculate averaged scores across all evaluators
  let averages = null
  if (evaluations.length > 0) {
    const sum = (key: keyof typeof evaluations[0]) =>
      evaluations.reduce((acc, e) => acc + (e[key] as number), 0)

    const count = evaluations.length
    averages = {
      communicationScore: Math.round((sum('communicationScore') / count) * 10) / 10,
      technicalScore: Math.round((sum('technicalScore') / count) * 10) / 10,
      motivationScore: Math.round((sum('motivationScore') / count) * 10) / 10,
      problemSolvingScore: Math.round((sum('problemSolvingScore') / count) * 10) / 10,
      teamworkScore: Math.round((sum('teamworkScore') / count) * 10) / 10,
      professionalismScore: Math.round((sum('professionalismScore') / count) * 10) / 10,
      overallImpression: Math.round((sum('overallImpression') / count) * 10) / 10,
      personalScore: Math.round((sum('personalScore') / count) * 10) / 10,
      evaluatorCount: count,
      // Composite interview score: average of all dimension scores (scaled to 0-100)
      compositeScore: Math.round(
        (((sum('communicationScore') +
          sum('technicalScore') +
          sum('motivationScore') +
          sum('problemSolvingScore') +
          sum('teamworkScore') +
          sum('professionalismScore') +
          sum('overallImpression')) /
          (count * 7)) *
          10) *
          10
      ) / 10,
    }
  }

  return apiSuccess({ evaluations, averages })
})

// POST — create or update evaluation (one per evaluator per application)
export const POST = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const staff = await requireStaff()
  const { applicationId } = ctx.params

  const body = await req.json()
  const parsed = evaluationSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message)

  // Verify application exists and is at interview stage
  const application = await prismaUnfiltered.application.findUnique({
    where: { id: applicationId },
    select: { id: true, stage: true },
  })
  if (!application) return apiError('Application not found', 404)

  const validStages = [
    'INTERVIEW_SCHEDULED',
    'INTERVIEW_COMPLETED',
    'SELECTED',
    'SHORTLISTED',
    'MEDICAL_PENDING',
    'MEDICAL_SUBMITTED',
    'MEDICAL_CLEARED',
    'ENROLLED',
  ]
  if (!validStages.includes(application.stage)) {
    return apiError('Application is not at a stage where interview evaluations can be submitted')
  }

  // Upsert: one evaluation per evaluator per application
  const evaluation = await prismaUnfiltered.interviewEvaluation.upsert({
    where: {
      applicationId_evaluatorId: {
        applicationId,
        evaluatorId: staff.id,
      },
    },
    create: {
      applicationId,
      evaluatorId: staff.id,
      ...parsed.data,
    },
    update: parsed.data,
    include: {
      evaluator: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  })

  await createAuditLog({
    userId: staff.id,
    action: 'CREATE',
    entity: 'InterviewEvaluation',
    entityId: evaluation.id,
    description: `Interview evaluation submitted for application ${applicationId}`,
    changes: {
      personalScore: parsed.data.personalScore,
      recommendation: parsed.data.recommendation,
    },
  })

  return apiCreated(evaluation)
})
