import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiCreated, apiError, apiPaginated, withErrorHandler, parsePagination } from '@/lib/api/response'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  academicYearId: z.string().optional().nullable(),
  startDate: z.string().transform(s => new Date(s)),
  endDate: z.string().transform(s => new Date(s)),
  isActive: z.boolean().default(true),
})

// GET /api/staff/admissions/intake-cycles
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const { searchParams } = new URL(req.url)
  const { page, limit, skip } = parsePagination(searchParams)

  const [cycles, total] = await Promise.all([
    prismaUnfiltered.intakeCycle.findMany({
      orderBy: { startDate: 'desc' },
      skip,
      take: limit,
      include: {
        academicYear: { select: { id: true, name: true } },
        _count: { select: { applications: true } },
      },
    }),
    prismaUnfiltered.intakeCycle.count(),
  ])

  return apiPaginated(cycles, total, page, limit)
})

// POST /api/staff/admissions/intake-cycles
export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message)

  const cycle = await prismaUnfiltered.intakeCycle.create({
    data: parsed.data as any,
    include: { academicYear: { select: { id: true, name: true } } },
  })

  return apiCreated(cycle)
})
