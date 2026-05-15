import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  academicYearId: z.string().optional().nullable(),
  startDate: z.string().transform(s => new Date(s)).optional(),
  endDate: z.string().transform(s => new Date(s)).optional(),
  isActive: z.boolean().optional(),
})

// GET /api/staff/admissions/intake-cycles/[id]
export const GET = withErrorHandler(async (_req: NextRequest, ctx: any) => {
  await requireStaff()
  const { id } = await ctx.params

  const cycle = await prismaUnfiltered.intakeCycle.findUnique({
    where: { id },
    include: {
      academicYear: { select: { id: true, name: true } },
      _count: { select: { applications: true } },
    },
  })
  if (!cycle) return apiNotFound('Intake cycle not found')

  return apiSuccess(cycle)
})

// PUT /api/staff/admissions/intake-cycles/[id]
export const PUT = withErrorHandler(async (req: NextRequest, ctx: any) => {
  await requireStaff()
  const { id } = await ctx.params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message)

  const existing = await prismaUnfiltered.intakeCycle.findUnique({ where: { id } })
  if (!existing) return apiNotFound('Intake cycle not found')

  const updated = await prismaUnfiltered.intakeCycle.update({
    where: { id },
    data: parsed.data as any,
    include: { academicYear: { select: { id: true, name: true } } },
  })

  return apiSuccess(updated)
})

// DELETE /api/staff/admissions/intake-cycles/[id]
export const DELETE = withErrorHandler(async (_req: NextRequest, ctx: any) => {
  await requireStaff()
  const { id } = await ctx.params

  const cycle = await prismaUnfiltered.intakeCycle.findUnique({
    where: { id },
    include: { _count: { select: { applications: true } } },
  })
  if (!cycle) return apiNotFound('Intake cycle not found')
  if (cycle._count.applications > 0) {
    return apiError('Cannot delete intake cycle with existing applications. Deactivate it instead.')
  }

  await prismaUnfiltered.intakeCycle.delete({ where: { id } })
  return apiSuccess({ deleted: true })
})
