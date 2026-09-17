import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler, RouteContext } from '@/lib/api/response'
import { ProgrammeChoice } from '@prisma/client'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  applicableProgrammes: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

// GET /api/staff/admissions/aptitude/banks/[id]
export const GET = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  await requireStaff()
  const { id } = (await ctx!.params) as { id: string }

  const bank = await prismaUnfiltered.aptitudeTestBank.findUnique({
    where: { id },
    include: {
      _count: { select: { questions: true, sessions: true } },
    },
  })

  if (!bank) return apiError('Bank not found', 404)
  return apiSuccess(bank)
})

// PUT /api/staff/admissions/aptitude/banks/[id]
export const PUT = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  await requireStaff()
  const { id } = (await ctx!.params) as { id: string }
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message)

  try {
    const bank = await prismaUnfiltered.aptitudeTestBank.update({
      where: { id },
      data: {
        ...parsed.data,
        applicableProgrammes: parsed.data.applicableProgrammes as ProgrammeChoice[] | undefined
      },
    })
    return apiSuccess(bank)
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && (error as Error & { code?: string }).code === 'P2025') return apiError('Bank not found', 404)
    throw error
  }
})

// DELETE /api/staff/admissions/aptitude/banks/[id]
export const DELETE = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  await requireStaff()
  const { id } = (await ctx!.params) as { id: string }

  // Check if bank has sessions
  const bank = await prismaUnfiltered.aptitudeTestBank.findUnique({
    where: { id },
    include: { _count: { select: { sessions: true } } },
  })

  if (!bank) return apiError('Bank not found', 404)
  if (bank._count.sessions > 0) {
    return apiError('Cannot delete a bank that has been used in test sessions', 409)
  }

  await prismaUnfiltered.aptitudeTestBank.delete({
    where: { id },
  })

  return apiSuccess({ deleted: true })
})
