import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiCreated, apiError, withErrorHandler } from '@/lib/api/response'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  applicableProgrammes: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
})

// GET /api/staff/admissions/aptitude/banks
export const GET = withErrorHandler(async () => {
  await requireStaff()

  const banks = await prismaUnfiltered.aptitudeTestBank.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { _count: { select: { questions: true, sessions: true } } },
  })

  return apiSuccess(banks)
})

// POST /api/staff/admissions/aptitude/banks
export const POST = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message)

  const bank = await prismaUnfiltered.aptitudeTestBank.create({
    data: parsed.data as Prisma.AptitudeTestBankUncheckedCreateInput,
  })

  return apiCreated(bank)
})
